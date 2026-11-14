import { normalizeWithMap } from "@/lib/text/normalize";
import type { Need, Urgency, UrgencySource, Vulnerable } from "@/lib/domain/types";
import { DANGER_KEYWORDS } from "./keywords";

export type RuleInput = { needs: Need[]; vulnerable: Vulnerable[]; text: string };

export type RuleResult = {
  urgency: Urgency;
  reason: string;
  /** Potongan teks asli yang memicu aturan, untuk disorot di layar petugas. */
  quote: string | null;
};

const RANK: Record<Urgency, number> = { rendah: 0, sedang: 1, tinggi: 2 };

export function urgencyRank(u: Urgency): number {
  return RANK[u];
}

export function maxUrgency(a: Urgency, b: Urgency): Urgency {
  return RANK[a] >= RANK[b] ? a : b;
}

/** Cari kata kunci bahaya dan kembalikan potongan teks aslinya. */
export function findDangerKeyword(text: string): { label: string; quote: string } | null {
  const { text: norm, map } = normalizeWithMap(text);
  for (const kw of DANGER_KEYWORDS) {
    const m = kw.pattern.exec(norm);
    if (!m) continue;
    const start = map[m.index];
    const end = map[m.index + m[0].length - 1];
    if (start === undefined || end === undefined) continue;
    return { label: kw.label, quote: text.slice(start, end + 1) };
  }
  return null;
}

/**
 * Aturan urgensi deterministik (CLAUDE.md 4A). Hasilnya batas bawah:
 * AI boleh menaikkan, tidak boleh menurunkan.
 */
export function applyUrgencyRules({ needs, vulnerable, text }: RuleInput): RuleResult {
  if (needs.includes("evakuasi")) {
    return {
      urgency: "tinggi",
      reason: "Pelapor memilih kebutuhan evakuasi atau terjebak.",
      quote: null,
    };
  }
  if (vulnerable.length > 0 && needs.includes("obat")) {
    return {
      urgency: "tinggi",
      reason: "Ada orang yang perlu didahulukan dan butuh obat atau perawatan.",
      quote: null,
    };
  }
  const danger = findDangerKeyword(text);
  if (danger) {
    return { urgency: "tinggi", reason: `Cerita menyebut "${danger.label}".`, quote: danger.quote };
  }
  if (vulnerable.length > 0) {
    return { urgency: "sedang", reason: "Ada orang yang perlu didahulukan.", quote: null };
  }
  if (needs.some((n) => n !== "lainnya")) {
    return { urgency: "sedang", reason: "Pelapor menyebut kebutuhan dasar.", quote: null };
  }
  return {
    urgency: "rendah",
    reason: "Tidak ada tanda bahaya atau kebutuhan mendesak.",
    quote: null,
  };
}

export type CombinedUrgency = {
  urgency: Urgency;
  source: UrgencySource;
  reason: string;
  quote: string | null;
};

/** Gabungkan aturan dan usulan AI: ambil yang lebih tinggi, aturan menang jika sama. */
export function combineUrgency(
  rule: RuleResult,
  ai: { urgency: Urgency; reason: string; quote: string | null } | null,
): CombinedUrgency {
  if (ai && RANK[ai.urgency] > RANK[rule.urgency]) {
    return { urgency: ai.urgency, source: "ai", reason: ai.reason, quote: ai.quote };
  }
  return {
    urgency: rule.urgency,
    source: "aturan",
    reason: rule.reason,
    quote: rule.quote ?? (ai && ai.urgency === rule.urgency ? ai.quote : null),
  };
}
