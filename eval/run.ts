import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { askSystem, askUser } from "@/lib/ai/prompts/ask";
import { REPORT_SYSTEM, reportUser } from "@/lib/ai/prompts/report";
import { PROMPT_VERSION } from "@/lib/ai/prompts/version";
import { isAiFailure, runAi } from "@/lib/ai/run";
import { askOut, reportExtractionOut } from "@/lib/ai/schemas";
import { guardAnswer } from "@/lib/board/guard";
import { boardItems } from "@/lib/board/items";
import type { BoardContent, Need, Urgency, Vulnerable } from "@/lib/domain/types";
import { applyExtraction } from "@/lib/reports/apply-extraction";
import { buildFormReport, reportFormSchema } from "@/lib/reports/create";
import { requireProviders, scriptDeps, scriptProviders } from "../scripts/ai-deps";

// Evaluasi akurasi dengan AI sungguhan. Hasil ditulis ke eval/RESULTS.md;
// README dan halaman "Cara kerja" hanya boleh mengutip angka dari berkas itu.

type ReportInput = {
  story: string;
  needs: Need[];
  vulnerable: Vulnerable[];
  village: string | null;
};
type ReportCase = {
  id: string;
  synthetic: boolean;
  input: ReportInput;
  expected: { urgency: Urgency; claims?: { field: string; value: number | string }[] };
};
type AskCase = { id: string; synthetic: boolean; question: string; expected: { found: boolean } };

const dir = path.join(process.cwd(), "eval", "cases");
const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
const load = (f: string) => JSON.parse(readFileSync(path.join(dir, f), "utf8"));

const pct = (n: number, d: number) =>
  d === 0 ? "n/a" : `${((100 * n) / d).toFixed(1)}% (${n}/${d})`;

async function runReport(c: ReportCase, deps: ReturnType<typeof scriptDeps>) {
  const input = reportFormSchema.parse({
    ...c.input,
    villageCode: null,
    forSelf: true,
    consent: true,
    story: c.input.story,
  });
  const { report } = buildFormReport(input, {
    id: c.id,
    publicCode: "TS-EVAL-0000",
    now: new Date(),
    demoSessionId: null,
  });
  const res = await runAi(
    {
      task: "laporan",
      system: REPORT_SYSTEM,
      user: reportUser(c.input),
      schema: reportExtractionOut,
    },
    deps,
  );
  if (isAiFailure(res)) return { report, patch: null };
  const patch = applyExtraction(
    report,
    res.data,
    { provider: res.provider, model: res.model, promptVersion: PROMPT_VERSION },
    [],
  );
  return { report, patch };
}

async function main() {
  requireProviders();
  const deps = scriptDeps();
  const reportCases: ReportCase[] = [];
  const askSets: { board: BoardContent; cases: AskCase[] }[] = [];
  for (const f of files) {
    const data = load(f);
    if (data.board) askSets.push({ board: data.board, cases: data.cases });
    else reportCases.push(...data.cases);
  }

  // Ekstraksi dan urgensi
  const fieldStats = new Map<string, { tp: number; fp: number; fn: number }>();
  let dropped = 0;
  let failures = 0;
  let highTp = 0;
  let highFp = 0;
  let highFn = 0;
  let urgencyCorrect = 0;
  for (const c of reportCases) {
    const { report, patch } = await runReport(c, deps);
    if (!patch) failures++;
    const urgency = patch?.urgency ?? report.urgency;
    if (urgency === c.expected.urgency) urgencyCorrect++;
    if (urgency === "tinggi" && c.expected.urgency === "tinggi") highTp++;
    if (urgency === "tinggi" && c.expected.urgency !== "tinggi") highFp++;
    if (urgency !== "tinggi" && c.expected.urgency === "tinggi") highFn++;

    if (c.expected.claims) {
      const got = patch?.extraction?.claims ?? [];
      dropped += patch?.extraction?.droppedClaims.length ?? 0;
      const key = (x: { field: string; value: number | string }) => `${x.field}=${x.value}`;
      const expected = new Set(c.expected.claims.map(key));
      const predicted = new Set(got.map(key));
      for (const k of new Set([...expected, ...predicted])) {
        const field = k.split("=")[0] ?? "";
        const s = fieldStats.get(field) ?? { tp: 0, fp: 0, fn: 0 };
        if (expected.has(k) && predicted.has(k)) s.tp++;
        else if (predicted.has(k)) s.fp++;
        else s.fn++;
        fieldStats.set(field, s);
      }
    }
  }

  // Tanya papan info
  let askTotal = 0;
  let answered = 0;
  let answeredSupported = 0;
  let notFound = 0;
  let notFoundCorrect = 0;
  for (const set of askSets) {
    const items = boardItems(set.board);
    for (const c of set.cases) {
      askTotal++;
      const res = await runAi(
        {
          task: "tanya",
          system: askSystem("112"),
          user: askUser(c.question, [
            {
              village: "Desa contoh",
              items: items.map(({ id, section, text }) => ({ id, section, text })),
            },
          ]),
          schema: askOut,
        },
        deps,
      );
      const guard = isAiFailure(res) ? null : guardAnswer(res.data, items, ["112"]);
      if (guard?.ok) {
        answered++;
        if (c.expected.found) answeredSupported++;
      } else {
        notFound++;
        if (!c.expected.found) notFoundCorrect++;
      }
    }
  }

  const models = scriptProviders()
    .map((p) => `${p.name}:${p.model}`)
    .join(", ");
  const synthetic = [...reportCases, ...askSets.flatMap((s) => s.cases)].filter(
    (c) => c.synthetic,
  ).length;
  const lines = [
    "# Hasil evaluasi",
    "",
    `- Tanggal: ${new Date().toISOString()}`,
    `- Model (urutan fallback): ${models}`,
    `- Versi prompt: ${PROMPT_VERSION}`,
    `- Jumlah kasus: ${reportCases.length} laporan, ${askTotal} pertanyaan (${synthetic} di antaranya kasus buatan/synthetic)`,
    `- Panggilan AI gagal: ${failures}`,
    "",
    "## Urgensi",
    "",
    `- Recall kelas tinggi: ${pct(highTp, highTp + highFn)}`,
    `- Presisi kelas tinggi: ${pct(highTp, highTp + highFp)}`,
    `- Akurasi tiga kelas: ${pct(urgencyCorrect, reportCases.length)}`,
    "",
    "## Ekstraksi angka (per field)",
    "",
    "| Field | Presisi | Recall |",
    "|---|---|---|",
    ...[...fieldStats.entries()].map(
      ([f, s]) => `| ${f} | ${pct(s.tp, s.tp + s.fp)} | ${pct(s.tp, s.tp + s.fn)} |`,
    ),
    "",
    `Klaim dibuang oleh verifikasi kutipan: ${dropped}`,
    "",
    "## Tanya papan info",
    "",
    `- Jawaban lolos penjaga yang memang didukung papan: ${pct(answeredSupported, answered)}`,
    `- "Belum ada informasi resmi" yang memang benar: ${pct(notFoundCorrect, notFound)}`,
    "",
  ];
  writeFileSync(path.join(process.cwd(), "eval", "RESULTS.md"), lines.join("\n"));
  console.log(lines.join("\n"));
}

void main();
