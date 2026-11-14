import { describe, expect, it } from "vitest";
import type { WhatsappExtractionOut } from "@/lib/ai/schemas";
import { groupIncidents } from "@/lib/extract/group";
import { differingLeft, resolveChoices, summaryValues } from "@/lib/extract/review";
import { buildWhatsappReports, isChatter, type BuildDeps } from "@/lib/reports/whatsapp";

const villages = [
  { code: "17.09.01.2001", name: "Taba Terunjam", districtName: "Karang Tinggi" },
  { code: "17.09.03.2010", name: "Srikaton", districtName: "Pondok Kelapa" },
];

let n = 0;
const deps = (meta: BuildDeps["meta"]): BuildDeps => ({
  newId: () => `id-${++n}`,
  newCode: () => `TS-AAAA-${String(n).padStart(4, "2")}`,
  now: new Date("2026-11-14T14:00:00Z"),
  demoSessionId: "demo",
  villages,
  toIso: (t) => `${t}:00+07:00`,
  meta,
});

const messages = [
  {
    id: "m1",
    sender: "Kades Taba",
    sentAt: "2026-11-14T21:02",
    text: "Taba Terunjam sdh 12 kk ngungsi, nenek tdk bisa keluar",
  },
  { id: "m2", sender: "Sekdes", sentAt: "2026-11-14T21:05", text: "siap pak" },
  {
    id: "m3",
    sender: "BMKG fwd",
    sentAt: "2026-11-14T21:06",
    text: "PERINGATAN DINI cuaca ekstrem 3 jam ke depan",
  },
];

const out: WhatsappExtractionOut = {
  messages: [
    {
      messageId: "m1",
      relevant: true,
      locationText: "Taba Terunjam",
      hazard: "banjir",
      claims: [
        { field: "mengungsi_kk", value: 12, approximate: false, quote: "12 kk ngungsi" },
        { field: "meninggal", value: 1, approximate: false, quote: "1 meninggal" },
      ],
      needs: ["evakuasi"],
      vulnerable: ["lansia"],
      urgency: "tinggi",
      urgencyReason: "Nenek tidak bisa keluar.",
      urgencyQuote: "nenek tdk bisa keluar",
      summary: "12 KK mengungsi, nenek tidak bisa keluar.",
    },
    { ...emptyMsg("m2") },
    { ...emptyMsg("m3") },
  ],
};

function emptyMsg(id: string) {
  return {
    messageId: id,
    relevant: false,
    locationText: null,
    hazard: null,
    claims: [],
    needs: [],
    vulnerable: [],
    urgency: "rendah" as const,
    urgencyReason: "",
    urgencyQuote: null,
    summary: "",
  };
}

describe("laporan dari WhatsApp", () => {
  it("dengan AI: pesan relevan jadi laporan, sisanya dilewati", () => {
    const r = buildWhatsappReports(
      messages,
      out,
      deps({ provider: "groq", model: "m", promptVersion: "v" }),
    );
    expect(r.reports).toHaveLength(1);
    expect(r.skipped).toBe(2);
    const rep = r.reports[0]!;
    expect(rep).toMatchObject({
      source: "whatsapp",
      villageCode: "17.09.01.2001",
      urgency: "tinggi",
      aiState: "selesai",
      demoSessionId: "demo",
      sourceMeta: { sender: "Kades Taba", sentAt: "2026-11-14T21:02:00+07:00" },
    });
    expect(rep.extraction?.claims).toHaveLength(1);
    expect(rep.extraction?.droppedClaims).toHaveLength(1);
    expect(r.events[0]).toMatchObject({ status: "diterima", reportId: rep.id });
  });

  it("tanpa AI: basa-basi dilewati, sisanya masuk apa adanya dengan urgensi aturan", () => {
    const r = buildWhatsappReports(messages, null, deps(null));
    expect(r.reports).toHaveLength(2);
    expect(r.reports.every((x) => x.aiState === "menunggu")).toBe(true);
    expect(r.reports[0]).toMatchObject({
      urgency: "tinggi",
      urgencySource: "aturan",
      villageCode: "17.09.01.2001",
    });
  });

  it("pesan yang tidak ada di keluaran AI tetap disimpan", () => {
    const partial = { messages: out.messages.slice(0, 1) };
    const r = buildWhatsappReports(
      messages,
      partial,
      deps({ provider: "groq", model: "m", promptVersion: "v" }),
    );
    expect(r.reports.map((x) => x.aiState)).toEqual(["selesai", "menunggu"]);
  });

  it("basa-basi dikenali", () => {
    expect(isChatter("siap pak")).toBe(true);
    expect(isChatter("Terima kasih bu")).toBe(true);
    expect(isChatter("ok")).toBe(true);
    expect(isChatter("air naik lagi di rt 3")).toBe(false);
  });
});

describe("meja periksa", () => {
  const group = groupIncidents([
    {
      id: "a",
      publicCode: "A",
      villageCode: "17.09.01.2001",
      hazard: "banjir",
      source: "form",
      at: "1",
      claims: [
        {
          messageId: "a",
          locationText: "",
          hazard: "banjir",
          field: "mengungsi_kk",
          value: 12,
          approximate: true,
          quote: "12 kk",
        },
        {
          messageId: "a",
          locationText: "",
          hazard: "banjir",
          field: "rumah_terendam",
          value: 30,
          approximate: false,
          quote: "30 rmh",
        },
      ],
    },
    {
      id: "b",
      publicCode: "B",
      villageCode: "17.09.01.2001",
      hazard: "banjir",
      source: "whatsapp",
      at: "2",
      claims: [
        {
          messageId: "b",
          locationText: "",
          hazard: "banjir",
          field: "mengungsi_kk",
          value: 15,
          approximate: false,
          quote: "15 kk",
        },
      ],
    },
  ])[0]!;

  it("angka berbeda wajib dipilih, angka tunggal otomatis", () => {
    expect(resolveChoices(group, {})).toEqual({
      chosen: { rumah_terendam: 30 },
      missing: ["mengungsi_kk"],
    });
    expect(resolveChoices(group, { mengungsi_kk: 1 }).chosen).toEqual({
      mengungsi_kk: 15,
      rumah_terendam: 30,
    });
  });

  it("pilihan di luar daftar dianggap belum dipilih", () => {
    expect(resolveChoices(group, { mengungsi_kk: 7 }).missing).toEqual(["mengungsi_kk"]);
  });

  it("ringkasan hanya memuat angka yang sudah diperiksa", () => {
    expect(summaryValues(group, null)).toEqual([]);
    expect(differingLeft(group, null)).toBe(1);
    const review = {
      demoSessionId: null,
      villageCode: "17.09.01.2001",
      hazard: "banjir" as const,
      chosen: { mengungsi_kk: 12, rumah_terendam: 30 },
      reviewedBy: "x",
      reviewedAt: "t",
    };
    expect(differingLeft(group, review)).toBe(0);
    expect(summaryValues(group, review)).toEqual([
      { field: "mengungsi_kk", value: 12, approximate: true },
      { field: "rumah_terendam", value: 30, approximate: false },
    ]);
  });
});
