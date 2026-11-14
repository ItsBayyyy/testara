import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import boardData from "../../../data/demo/board.json";
import reportData from "../../../data/demo/reports.json";
import { PROMPT_VERSION } from "@/lib/ai/prompts/version";
import { reportExtractionOut } from "@/lib/ai/schemas";
import { getStore, type Scope } from "@/lib/db";
import { generatePublicCode } from "@/lib/domain/code";
import type { BoardContent, Report } from "@/lib/domain/types";
import { buildFormReport, reportFormSchema } from "@/lib/reports/create";
import { applyExtraction } from "@/lib/reports/apply-extraction";
import { listVillages } from "@/lib/wilayah";
import { loadDemoAiResults } from "./ai-results";
import { storyFingerprint } from "./fingerprint";

type DemoReport = (typeof reportData.reports)[number];

function buildDemoReport(item: DemoReport, scope: Scope, now: Date): Report {
  const input = reportFormSchema.parse({ ...item, consent: true });
  const created = new Date(now.getTime() - item.minutesAgo * 60_000);
  const { report } = buildFormReport(input, {
    id: randomUUID(),
    publicCode: generatePublicCode((n) => randomBytes(n)),
    now: created,
    demoSessionId: scope.demoSessionId,
  });

  // Hasil AI untuk data contoh dibuat sekali dengan `npm run demo:generate`
  // (panggilan AI sungguhan), sehingga sesi demo tidak memanggil AI.
  const saved = loadDemoAiResults()[item.key];
  if (!saved || saved.fingerprint !== storyFingerprint(item.story)) return report;
  const parsed = reportExtractionOut.safeParse(saved.output);
  if (!parsed.success) return report;
  const villages = listVillages().map((v) => ({
    code: v.code,
    name: v.name,
    districtName: v.districtName,
  }));
  const patch = applyExtraction(
    report,
    parsed.data,
    {
      provider: saved.provider,
      model: saved.model,
      promptVersion: saved.promptVersion ?? PROMPT_VERSION,
    },
    villages,
  );
  return { ...report, ...patch };
}

/** Isi sesi demo baru dengan 12 laporan contoh dan papan info untuk 2 desa. */
export async function seedDemoData(scope: Scope, now: Date): Promise<void> {
  const store = getStore();
  const reports = reportData.reports.map((item) => buildDemoReport(item, scope, now));
  await store.insertReports(reports, scope);
  await store.addEvents(
    reports.map((r) => ({
      reportId: r.id,
      status: "diterima" as const,
      actor: "system" as const,
      createdAt: r.createdAt,
    })),
  );
  for (const board of boardData.boards) {
    await store.publishBoard(
      {
        id: randomUUID(),
        demoSessionId: scope.demoSessionId,
        villageCode: board.villageCode,
        content: board.content as BoardContent,
        publishedAt: new Date(now.getTime() - board.minutesAgo * 60_000).toISOString(),
        publishedBy: "Petugas posko (contoh)",
      },
      scope,
    );
  }
}
