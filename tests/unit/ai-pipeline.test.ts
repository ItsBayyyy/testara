import { describe, expect, it, vi } from "vitest";
import type { AIProvider } from "@/lib/ai/providers/types";
import { ProviderError } from "@/lib/ai/providers/types";
import { cacheKey, isAiFailure, runAi, type AiDeps } from "@/lib/ai/run";
import { reportExtractionOut, toProviderSchema, type ReportExtractionOut } from "@/lib/ai/schemas";
import type { Report } from "@/lib/domain/types";
import { applyExtraction, templateSummary } from "@/lib/reports/apply-extraction";

const goodOutput: ReportExtractionOut = {
  locationText: "Taba Terunjam rt 2",
  hazard: "banjir",
  claims: [{ field: "rumah_terendam", value: 5, approximate: false, quote: "5 rmh terendam" }],
  needs: ["evakuasi"],
  vulnerable: ["lansia"],
  urgency: "tinggi",
  urgencyReason: "Nenek tidak bisa keluar rumah.",
  urgencyQuote: "nenek tdk bisa keluar",
  summary: "Banjir merendam 5 rumah, nenek tidak bisa keluar rumah.",
  possiblyIrrelevant: false,
};

function provider(
  name: "groq" | "gemini",
  responses: (string | Error)[],
): AIProvider & { calls: number } {
  const p = {
    name,
    model: `${name}-model`,
    calls: 0,
    async generate() {
      const r = responses[Math.min(p.calls, responses.length - 1)];
      p.calls++;
      if (r instanceof Error) throw r;
      return r ?? "";
    },
  };
  return p;
}

function deps(providers: AIProvider[], budget = 100): AiDeps & { cache: Map<string, unknown> } {
  const cache = new Map<string, unknown>();
  let used = 0;
  return {
    cache,
    providers,
    cacheGet: async (k) => cache.get(k) ?? null,
    cacheSet: async (k, v) => void cache.set(k, v),
    takeBudget: async () => ++used <= budget,
  };
}

const task = { task: "laporan", system: "s", user: "u", schema: reportExtractionOut };

describe("orkestrasi AI", () => {
  it("tanpa penyedia: tidak dikonfigurasi", async () => {
    expect(await runAi(task, deps([]))).toEqual({ reason: "tidak_dikonfigurasi" });
  });

  it("memakai penyedia utama jika berhasil", async () => {
    const groq = provider("groq", [JSON.stringify(goodOutput)]);
    const r = await runAi(task, deps([groq]));
    expect(isAiFailure(r)).toBe(false);
    if (!isAiFailure(r)) expect(r).toMatchObject({ provider: "groq", cached: false });
  });

  it("pindah ke cadangan saat 429", async () => {
    const groq = provider("groq", [new ProviderError("groq", 429, true)]);
    const gemini = provider("gemini", [JSON.stringify(goodOutput)]);
    const r = await runAi(task, deps([groq, gemini]));
    expect(!isAiFailure(r) && r.provider).toBe("gemini");
    expect(groq.calls).toBe(1);
  });

  it("mengulang sekali saat keluaran tidak sesuai skema", async () => {
    const groq = provider("groq", ['{"salah": true}', JSON.stringify(goodOutput)]);
    const d = deps([groq]);
    const generate = vi.spyOn(groq, "generate");
    const r = await runAi(task, d);
    expect(isAiFailure(r)).toBe(false);
    expect(generate).toHaveBeenCalledTimes(2);
    expect(generate.mock.calls[1]?.[0].user).toContain("tidak sesuai skema");
  });

  it("menerima JSON yang dibungkus ```json", async () => {
    const groq = provider("groq", ["```json\n" + JSON.stringify(goodOutput) + "\n```"]);
    expect(isAiFailure(await runAi(task, deps([groq])))).toBe(false);
  });

  it("semua gagal setelah dua kali tidak valid di setiap penyedia", async () => {
    const groq = provider("groq", ["bukan json"]);
    const gemini = provider("gemini", ['{"a":1}']);
    expect(await runAi(task, deps([groq, gemini]))).toEqual({ reason: "semua_gagal" });
    expect(groq.calls + gemini.calls).toBe(4);
  });

  it("input yang sama diambil dari cache, tidak memanggil AI lagi", async () => {
    const groq = provider("groq", [JSON.stringify(goodOutput)]);
    const d = deps([groq]);
    await runAi(task, d);
    const second = await runAi(task, d);
    expect(groq.calls).toBe(1);
    expect(!isAiFailure(second) && second.cached).toBe(true);
    expect(d.cache.has(cacheKey("laporan", "u", "groq-model"))).toBe(true);
  });

  it("berhenti saat anggaran harian habis", async () => {
    const groq = provider("groq", [JSON.stringify(goodOutput)]);
    expect(await runAi(task, deps([groq], 0))).toEqual({ reason: "anggaran_habis" });
    expect(groq.calls).toBe(0);
  });

  it("skema penyedia memenuhi syarat mode strict", () => {
    const schema = toProviderSchema(reportExtractionOut) as {
      required: string[];
      properties: Record<string, unknown>;
      additionalProperties: boolean;
    };
    expect(schema.additionalProperties).toBe(false);
    expect(schema.required.sort()).toEqual(Object.keys(schema.properties).sort());
    expect(JSON.stringify(schema)).not.toContain("$schema");
  });
});

const baseReport: Report = {
  id: "r1",
  publicCode: "TS-AAAA-BBBB",
  demoSessionId: null,
  villageCode: null,
  needs: ["air_bersih"],
  vulnerable: [],
  forSelf: true,
  storyText: "air naik, 5 rmh terendam di rt 2. nenek tdk bisa keluar. hub 081234567890",
  reporterPhone: "081200001111",
  source: "form",
  sourceMeta: null,
  status: "diterima",
  urgency: "tinggi",
  urgencySource: "aturan",
  urgencyReason: 'Cerita menyebut "tidak bisa keluar".',
  urgencyQuote: "tdk bisa keluar",
  aiState: "menunggu",
  extraction: null,
  createdAt: "2026-11-14T14:00:00.000Z",
  updatedAt: "2026-11-14T14:00:00.000Z",
  expiresAt: "2026-12-14T14:00:00.000Z",
};

const villages = [{ code: "17.09.01.2001", name: "Taba Terunjam", districtName: "Karang Tinggi" }];
const meta = { provider: "groq", model: "m", promptVersion: "v" };

describe("menerapkan hasil AI ke laporan", () => {
  it("menyimpan klaim terverifikasi dan membuang klaim karangan", () => {
    const out = {
      ...goodOutput,
      claims: [
        ...goodOutput.claims,
        { field: "meninggal" as const, value: 2, approximate: false, quote: "2 org meninggal" },
      ],
    };
    const patch = applyExtraction(baseReport, out, meta, villages);
    expect(patch.aiState).toBe("selesai");
    expect(patch.extraction?.claims).toHaveLength(1);
    expect(patch.extraction?.droppedClaims[0]?.reason).toBe("kutipan tidak ada di pesan sumber");
  });

  it("AI tidak bisa menurunkan urgensi dari aturan", () => {
    const patch = applyExtraction(baseReport, { ...goodOutput, urgency: "rendah" }, meta, villages);
    expect(patch.urgency).toBe("tinggi");
    expect(patch.urgencySource).toBe("aturan");
  });

  it("AI boleh menaikkan urgensi", () => {
    const calm = {
      ...baseReport,
      storyText: "air bersih habis, 5 rmh terendam",
      urgency: "sedang" as const,
    };
    const patch = applyExtraction(calm, goodOutput, meta, villages);
    expect(patch).toMatchObject({ urgency: "tinggi", urgencySource: "ai" });
    // Kutipan urgensi AI tidak ada di cerita ini, jadi tidak dipakai.
    expect(patch.urgencyQuote).toBeNull();
  });

  it("urgensi yang sudah diubah petugas tidak disentuh", () => {
    const patch = applyExtraction(
      { ...baseReport, urgencySource: "petugas" },
      goodOutput,
      meta,
      villages,
    );
    expect(patch.urgency).toBeUndefined();
  });

  it("ringkasan dengan angka tanpa saksi diganti template", () => {
    const patch = applyExtraction(
      baseReport,
      { ...goodOutput, summary: "12 rumah terendam." },
      meta,
      villages,
    );
    expect(patch.extraction?.summary).toBe(templateSummary(baseReport));
    expect(patch.extraction?.summary).not.toMatch(/\d/);
  });

  it("desa diisi dari lokasi teks jika pelapor tidak memilih", () => {
    expect(applyExtraction(baseReport, goodOutput, meta, villages).villageCode).toBe(
      "17.09.01.2001",
    );
    const chosen = { ...baseReport, villageCode: "17.09.03.2010" };
    expect(applyExtraction(chosen, goodOutput, meta, villages).villageCode).toBeUndefined();
  });
});
