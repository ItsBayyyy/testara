import type { ReportExtractionOut } from "@/lib/ai/schemas";
import type { Claim, Report } from "@/lib/domain/types";
import { NEED_LABELS, VULNERABLE_LABELS } from "@/lib/domain/labels";
import type { ReportPatch } from "@/lib/db/store";
import { matchLocation, type VillageRef } from "@/lib/extract/location";
import { verifiedQuoteOrNull, verifyClaims } from "@/lib/extract/verify";
import { maskPhoneNumbers } from "@/lib/privacy/mask";
import { checkNumbersSupported } from "@/lib/text/numbers";
import { applyUrgencyRules, combineUrgency } from "@/lib/triage/rules";

// Menggabungkan keluaran AI dengan laporan: verifikasi kutipan, penjaga angka,
// aturan urgensi, dan normalisasi lokasi. Fungsi murni.

/** Ringkasan cadangan tanpa angka, dipakai jika ringkasan AI gagal penjaga angka. */
export function templateSummary(r: Pick<Report, "needs" | "vulnerable">): string {
  const parts: string[] = [];
  parts.push(
    r.needs.length
      ? `Butuh ${r.needs.map((n) => NEED_LABELS[n].toLowerCase()).join(", ")}.`
      : "Kebutuhan tidak dipilih.",
  );
  if (r.vulnerable.length) {
    parts.push(
      `Perlu didahulukan: ${r.vulnerable.map((v) => VULNERABLE_LABELS[v].toLowerCase()).join(", ")}.`,
    );
  }
  return parts.join(" ");
}

export type ExtractionMeta = { provider: string; model: string; promptVersion: string };

export function applyExtraction(
  report: Report,
  out: ReportExtractionOut,
  meta: ExtractionMeta,
  villages: VillageRef[],
): ReportPatch {
  // Model hanya melihat teks tersamar, jadi kutipan diverifikasi terhadap teks itu.
  const source = maskPhoneNumbers(report.storyText);
  const claims: Claim[] = out.claims.map((c) => ({
    ...c,
    messageId: report.id,
    hazard: out.hazard ?? "lainnya",
    locationText: out.locationText ?? "",
  }));
  const { kept, dropped } = verifyClaims(claims, { [report.id]: source });
  const urgencyQuote = verifiedQuoteOrNull(source, out.urgencyQuote);

  const summaryCheck = checkNumbersSupported(out.summary, [source]);
  const words = out.summary.trim().split(/\s+/).length;
  const summary =
    summaryCheck.ok && words <= 30 && out.summary.trim()
      ? out.summary.trim()
      : templateSummary(report);

  const patch: ReportPatch = {
    aiState: "selesai",
    extraction: {
      ...out,
      claims: kept,
      urgencyQuote,
      summary,
      droppedClaims: dropped,
      ...meta,
    },
  };

  if (report.urgencySource !== "petugas") {
    const rule = applyUrgencyRules({
      needs: report.needs,
      vulnerable: report.vulnerable,
      text: report.storyText,
    });
    const combined = combineUrgency(rule, {
      urgency: out.urgency,
      reason: out.urgencyReason,
      quote: urgencyQuote,
    });
    patch.urgency = combined.urgency;
    patch.urgencySource = combined.source;
    patch.urgencyReason = combined.reason;
    patch.urgencyQuote = combined.quote;
  }

  if (!report.villageCode) {
    const match = matchLocation(out.locationText, villages);
    if (match.kind === "cocok") patch.villageCode = match.village.code;
  }
  return patch;
}
