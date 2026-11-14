import "server-only";
import { callAi, isAiFailure } from "@/lib/ai";
import { PROMPT_VERSION } from "@/lib/ai/prompts/version";
import { REPORT_SYSTEM, reportUser } from "@/lib/ai/prompts/report";
import { reportExtractionOut } from "@/lib/ai/schemas";
import { getStore, type Scope } from "@/lib/db";
import type { AiState } from "@/lib/domain/types";
import { maskPhoneNumbers } from "@/lib/privacy/mask";
import { findVillage, listVillages, villageLabel } from "@/lib/wilayah";
import { applyExtraction } from "./apply-extraction";

/**
 * Rapikan satu laporan dengan AI. Aman dipanggil berulang: laporan yang sudah
 * selesai dilewati. Jika AI tidak tersedia, laporan tetap "menunggu" dan
 * diproses ulang saat antrean dibuka; urgensi dari aturan tetap berlaku.
 */
export async function processReport(id: string, scope: Scope): Promise<AiState | null> {
  const store = getStore();
  const report = await store.getReport(id, scope);
  if (!report) return null;
  if (report.aiState === "selesai") return "selesai";

  const village = findVillage(report.villageCode);
  const result = await callAi({
    task: "laporan",
    system: REPORT_SYSTEM,
    // Nomor HP pelapor tidak pernah dikirim; nomor di dalam cerita disamarkan.
    user: reportUser({
      story: maskPhoneNumbers(report.storyText),
      needs: report.needs,
      vulnerable: report.vulnerable,
      village: village ? `${villageLabel(village)}, Kecamatan ${village.districtName}` : null,
    }),
    schema: reportExtractionOut,
  });

  if (isAiFailure(result)) {
    const state: AiState = result.reason === "semua_gagal" ? "gagal" : "menunggu";
    if (state !== report.aiState) await store.updateReport(id, scope, { aiState: state });
    return state;
  }

  const villages = listVillages().map((v) => ({
    code: v.code,
    name: v.name,
    districtName: v.districtName,
  }));
  const patch = applyExtraction(
    report,
    result.data,
    { provider: result.provider, model: result.model, promptVersion: PROMPT_VERSION },
    villages,
  );
  await store.updateReport(id, scope, patch);
  return "selesai";
}
