import { writeFileSync } from "node:fs";
import path from "node:path";
import reportData from "../data/demo/reports.json";
import { REPORT_SYSTEM, reportUser } from "@/lib/ai/prompts/report";
import { PROMPT_VERSION } from "@/lib/ai/prompts/version";
import { isAiFailure, runAi } from "@/lib/ai/run";
import { reportExtractionOut } from "@/lib/ai/schemas";
import { storyFingerprint } from "@/lib/demo/fingerprint";
import { maskPhoneNumbers } from "@/lib/privacy/mask";
import { findVillage, villageLabel } from "@/lib/wilayah";
import { requireProviders, scriptDeps } from "./ai-deps";

// Jalankan AI sungguhan atas 12 laporan contoh dan simpan hasilnya ke
// data/demo/ai-results.json, supaya sesi demo tidak memanggil AI.

async function main() {
  requireProviders();
  const deps = scriptDeps();
  const results: Record<string, unknown> = {};
  for (const item of reportData.reports) {
    const village = findVillage(item.villageCode);
    const res = await runAi(
      {
        task: "laporan",
        system: REPORT_SYSTEM,
        user: reportUser({
          story: maskPhoneNumbers(item.story),
          needs: item.needs,
          vulnerable: item.vulnerable,
          village: village ? `${villageLabel(village)}, Kecamatan ${village.districtName}` : null,
        }),
        schema: reportExtractionOut,
      },
      deps,
    );
    if (isAiFailure(res)) {
      console.error(`${item.key}: gagal (${res.reason})`);
      continue;
    }
    results[item.key] = {
      fingerprint: storyFingerprint(item.story),
      provider: res.provider,
      model: res.model,
      promptVersion: PROMPT_VERSION,
      generatedAt: new Date().toISOString(),
      output: res.data,
    };
    console.log(`${item.key}: ok (${res.provider})`);
  }
  const file = path.join(process.cwd(), "data", "demo", "ai-results.json");
  const note =
    "Hasil AI sungguhan untuk data contoh. Dibuat dengan `npm run demo:generate`. Jangan disunting tangan.";
  writeFileSync(file, `${JSON.stringify({ note, results }, null, 2)}\n`);
  console.log(`${Object.keys(results).length} hasil ditulis ke ${file}`);
}

void main();
