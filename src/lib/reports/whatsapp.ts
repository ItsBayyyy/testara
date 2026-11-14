import type { WhatsappExtractionOut } from "@/lib/ai/schemas";
import type { Claim, Report, ReportEvent, StoredExtraction } from "@/lib/domain/types";
import { matchLocation, type VillageRef } from "@/lib/extract/location";
import { verifiedQuoteOrNull, verifyClaims } from "@/lib/extract/verify";
import { checkNumbersSupported } from "@/lib/text/numbers";
import { applyUrgencyRules, combineUrgency } from "@/lib/triage/rules";
import { RETENTION_DAYS } from "./create";

// Pesan WhatsApp yang ditempel petugas menjadi laporan bersumber "WhatsApp".
// Fungsi murni: ID, kode, dan waktu disuntikkan.

export type WaMessage = { id: string; sender: string | null; sentAt: string | null; text: string };

const CHATTER =
  /^(siap|ok|oke|okey|baik|baik pak|terima ?kasih|makasih|trims|mantap|noted|sip|iya|ya|amin|aamiin|alhamdulillah|semangat)\b[\s.!,pakbu]*$/i;

/** Pesan basa-basi tanpa isi laporan; hanya dipakai saat AI tidak tersedia. */
export function isChatter(text: string): boolean {
  const t = text.trim();
  return t.length < 8 || CHATTER.test(t);
}

export type BuildDeps = {
  newId: () => string;
  newCode: () => string;
  now: Date;
  demoSessionId: string | null;
  villages: VillageRef[];
  toIso: (localTime: string) => string;
  meta: { provider: string; model: string; promptVersion: string } | null;
};

export type AmbiguousVillage = { reportId: string; locationText: string; candidates: VillageRef[] };

export type BuildResult = {
  reports: Report[];
  events: ReportEvent[];
  skipped: number;
  ambiguous: AmbiguousVillage[];
};

export function buildWhatsappReports(
  messages: WaMessage[],
  out: WhatsappExtractionOut | null,
  deps: BuildDeps,
): BuildResult {
  const result: BuildResult = { reports: [], events: [], skipped: 0, ambiguous: [] };

  messages.forEach((msg, index) => {
    const ai = out?.messages.find((m) => m.messageId === msg.id) ?? null;
    if (ai ? !ai.relevant : isChatter(msg.text)) {
      result.skipped++;
      return;
    }

    const id = deps.newId();
    const created = new Date(deps.now.getTime() + index).toISOString();
    const needs = ai?.needs ?? [];
    const vulnerable = ai?.vulnerable ?? [];
    const rule = applyUrgencyRules({ needs, vulnerable, text: msg.text });

    let extraction: StoredExtraction | null = null;
    let urgency = combineUrgency(rule, null);
    if (ai && deps.meta) {
      const claims: Claim[] = ai.claims.map((c) => ({
        ...c,
        messageId: id,
        hazard: ai.hazard ?? "lainnya",
        locationText: ai.locationText ?? "",
      }));
      const { kept, dropped } = verifyClaims(claims, { [id]: msg.text });
      const urgencyQuote = verifiedQuoteOrNull(msg.text, ai.urgencyQuote);
      const summaryOk =
        checkNumbersSupported(ai.summary, [msg.text]).ok && ai.summary.trim() !== "";
      extraction = {
        locationText: ai.locationText,
        hazard: ai.hazard,
        claims: kept,
        needs,
        vulnerable,
        urgency: ai.urgency,
        urgencyReason: ai.urgencyReason,
        urgencyQuote,
        summary: summaryOk ? ai.summary.trim() : msg.text.slice(0, 140),
        possiblyIrrelevant: false,
        droppedClaims: dropped,
        ...deps.meta,
      };
      urgency = combineUrgency(rule, {
        urgency: ai.urgency,
        reason: ai.urgencyReason,
        quote: urgencyQuote,
      });
    }

    const location = matchLocation(ai?.locationText ?? msg.text, deps.villages);
    if (location.kind === "ambigu") {
      result.ambiguous.push({
        reportId: id,
        locationText: ai?.locationText ?? msg.text,
        candidates: location.candidates,
      });
    }

    result.reports.push({
      id,
      publicCode: deps.newCode(),
      demoSessionId: deps.demoSessionId,
      villageCode: location.kind === "cocok" ? location.village.code : null,
      needs,
      vulnerable,
      forSelf: false,
      storyText: msg.text,
      reporterPhone: null,
      source: "whatsapp",
      sourceMeta: { sender: msg.sender, sentAt: msg.sentAt ? deps.toIso(msg.sentAt) : null },
      status: "diterima",
      urgency: urgency.urgency,
      urgencySource: urgency.source,
      urgencyReason: urgency.reason,
      urgencyQuote: urgency.quote,
      aiState: extraction ? "selesai" : "menunggu",
      extraction,
      createdAt: created,
      updatedAt: created,
      expiresAt: new Date(deps.now.getTime() + RETENTION_DAYS * 86_400_000).toISOString(),
    });
    result.events.push({ reportId: id, status: "diterima", actor: "system", createdAt: created });
  });

  return result;
}
