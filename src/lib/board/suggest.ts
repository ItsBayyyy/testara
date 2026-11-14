import type { BoardSuggestionOut } from "@/lib/ai/schemas";
import { NEED_LABELS } from "@/lib/domain/labels";
import { NEEDS, type Report } from "@/lib/domain/types";
import { locateQuote } from "@/lib/text/normalize";
import { checkNumbersSupported } from "@/lib/text/numbers";

// Usulan isi papan info dari laporan yang sudah diperiksa petugas.
// Usulan hanya bahan; petugas yang menyunting dan menerbitkan.

export type Suggestion = { section: "announcedNeeds" | "notes"; text: string; source: string };

/** Usulan tanpa AI: kebutuhan yang paling sering dipilih di laporan resmi. */
export function suggestFromNeeds(reports: Pick<Report, "needs">[]): Suggestion[] {
  return NEEDS.filter((n) => n !== "lainnya")
    .map((need) => ({ need, count: reports.filter((r) => r.needs.includes(need)).length }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .map(({ need, count }) => ({
      section: "announcedNeeds" as const,
      text: NEED_LABELS[need],
      source: `dipilih di ${count} laporan resmi`,
    }));
}

/** Usulan AI hanya lolos jika kutipannya ada di laporan dan angkanya punya saksi. */
export function verifySuggestions(out: BoardSuggestionOut, sources: string[]): Suggestion[] {
  const accept = (s: { text: string; quote: string }) =>
    s.text.trim() !== "" &&
    sources.some((src) => locateQuote(src, s.quote) !== null) &&
    checkNumbersSupported(s.text, sources).ok;
  return [
    ...out.announcedNeeds.filter(accept).map((s) => ({
      section: "announcedNeeds" as const,
      text: s.text.trim(),
      source: `"${s.quote}"`,
    })),
    ...out.notes
      .filter(accept)
      .map((s) => ({ section: "notes" as const, text: s.text.trim(), source: `"${s.quote}"` })),
  ];
}
