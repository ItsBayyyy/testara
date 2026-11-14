import { normalizeText } from "@/lib/text/normalize";
import { numbersInText } from "@/lib/text/numbers";
import type { AidKind } from "@/lib/domain/types";
import type { BoardItem, BoardSection } from "./items";

// Penjaga jawaban (CLAUDE.md 4C): jawaban AI hanya boleh lolos jika semua
// butir yang dirujuk ada, dan setiap angka, jam, serta nama tempat di jawaban
// muncul di butir yang dirujuk.

export type AskModelOutput = { answer: string; usedItems: string[]; found: boolean };

export type GuardResult = { ok: true; items: BoardItem[] } | { ok: false; reason: string };

// Kata berhuruf kapital yang lazim di awal kalimat atau sapaan, bukan nama tempat.
const COMMON_CAPITALIZED = new Set(
  [
    "anda",
    "bapak",
    "ibu",
    "silakan",
    "di",
    "ke",
    "dari",
    "untuk",
    "ada",
    "belum",
    "tidak",
    "ya",
    "posko",
    "pengungsian",
    "titik",
    "bantuan",
    "air",
    "bersih",
    "dapur",
    "umum",
    "pos",
    "kesehatan",
    "kontak",
    "hubungi",
    "jika",
    "kalau",
    "saat",
    "ini",
    "itu",
    "yang",
    "dan",
    "atau",
    "buka",
    "jam",
    "wib",
    "pukul",
    "setiap",
    "hari",
    "tersedia",
    "informasi",
    "resmi",
    "papan",
    "info",
    "desa",
    "kelurahan",
    "catatan",
    "kebutuhan",
    "lokasi",
    "menurut",
    "berdasarkan",
    "terdekat",
    "bisa",
    "dapat",
    "mohon",
    "segera",
    "telepon",
    "nomor",
    "darurat",
    "whatsapp",
    "wa",
  ].map((w) => w.toLowerCase()),
);

/** Ambil rangkaian kata berhuruf kapital (calon nama tempat) dari jawaban. */
export function capitalizedPhrases(text: string): string[] {
  const out: string[] = [];
  const re = /\b[A-Z][\p{L}'-]*(?:\s+[A-Z][\p{L}'-]*)*/gu;
  for (const m of text.matchAll(re)) {
    const words = m[0].split(/\s+/).filter((w) => !COMMON_CAPITALIZED.has(w.toLowerCase()));
    // Satu kata di awal kalimat biasanya hanya huruf kapital tata bahasa.
    const atSentenceStart = /(^|[.!?:]\s*)$/.test(text.slice(0, m.index));
    if (words.length === 0 || (atSentenceStart && m[0].split(/\s+/).length === 1)) continue;
    out.push(words.join(" "));
  }
  return out;
}

/**
 * `extraAllowed` berisi teks yang boleh disebut walau tidak ada di butir papan,
 * mis. nomor darurat yang memang diberikan ke model.
 */
export function guardAnswer(
  output: AskModelOutput,
  items: BoardItem[],
  extraAllowed: string[] = [],
): GuardResult {
  if (!output.found) return { ok: false, reason: "model menyatakan data tidak ada" };
  if (!output.answer.trim()) return { ok: false, reason: "jawaban kosong" };
  if (output.usedItems.length === 0) return { ok: false, reason: "tidak merujuk butir papan" };

  const byId = new Map(items.map((i) => [i.id, i]));
  const used: BoardItem[] = [];
  for (const id of output.usedItems) {
    const item = byId.get(id);
    if (!item) return { ok: false, reason: `butir ${id} tidak ada` };
    used.push(item);
  }

  const evidence = [...used.map((i) => i.text), ...extraAllowed];
  const allowedNumbers = new Set(evidence.flatMap(numbersInText));
  const missingNumber = numbersInText(output.answer).find((n) => !allowedNumbers.has(n));
  if (missingNumber !== undefined) {
    return { ok: false, reason: `angka ${missingNumber} tidak ada di butir yang dirujuk` };
  }

  const evidenceText = normalizeText(evidence.join(" "));
  const missingPlace = capitalizedPhrases(output.answer).find(
    (p) => !evidenceText.includes(normalizeText(p)),
  );
  if (missingPlace)
    return { ok: false, reason: `nama "${missingPlace}" tidak ada di butir yang dirujuk` };

  return { ok: true, items: used };
}

// Pencocokan kata kunci untuk cadangan saat AI tidak tersedia atau jawaban ditolak.
const SECTION_HINTS: Record<BoardSection, string[]> = {
  pengungsian: [
    "posko",
    "ngungsi",
    "mengungsi",
    "pengungsian",
    "tidur",
    "menginap",
    "tenda",
    "aman",
    "evakuasi",
  ],
  titik_bantuan: ["bantuan", "ambil", "sembako", "logistik"],
  kebutuhan: ["butuh", "dibutuhkan", "sumbang", "sumbangan", "donasi", "kirim", "bantu", "perlu"],
  kontak: [
    "kontak",
    "telepon",
    "telpon",
    "hubungi",
    "nomor",
    "hp",
    "wa",
    "whatsapp",
    "petugas",
    "koordinator",
  ],
  catatan: ["jalan", "akses", "info", "kabar", "terbaru"],
};

const AID_HINTS: Record<AidKind, string[]> = {
  air_bersih: ["air", "minum", "bersih", "galon"],
  dapur_umum: ["makan", "makanan", "nasi", "dapur", "lapar"],
  pos_kesehatan: [
    "obat",
    "sakit",
    "dokter",
    "bidan",
    "puskesmas",
    "kesehatan",
    "berobat",
    "luka",
    "demam",
    "perawat",
  ],
  lainnya: [],
};

function hintsFor(item: BoardItem): string[] {
  return item.kind
    ? [...SECTION_HINTS[item.section], ...AID_HINTS[item.kind]]
    : SECTION_HINTS[item.section];
}

const STOPWORDS = new Set([
  "di",
  "ke",
  "dari",
  "mana",
  "yang",
  "dan",
  "atau",
  "ada",
  "apa",
  "saya",
  "kami",
  "bisa",
  "untuk",
  "dimana",
  "kemana",
  "bagaimana",
  "gimana",
  "kapan",
  "berapa",
  "ini",
  "itu",
  "sudah",
  "belum",
  "mau",
  "terdekat",
  "dekat",
  "tolong",
  "pak",
  "bu",
  "mau",
  "ingin",
  "perlu",
]);

function tokens(text: string): string[] {
  return normalizeText(text)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

export function findRelevantItems(question: string, items: BoardItem[], limit = 3): BoardItem[] {
  const q = tokens(question);
  if (q.length === 0) return [];
  const scored = items.map((item) => {
    const itemTokens = new Set(tokens(item.text));
    let score = q.filter((t) => itemTokens.has(t)).length * 2;
    const hints = hintsFor(item);
    // Maksud pertanyaan (mis. "posko" = tempat mengungsi) lebih berbobot dari kata yang kebetulan sama.
    score += q.filter((t) => hints.includes(t)).length * 3;
    return { item, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.item);
}
