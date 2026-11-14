import { describe, expect, it } from "vitest";
import type { BoardContent } from "@/lib/domain/types";
import { boardItems } from "@/lib/board/items";
import { capitalizedPhrases, findRelevantItems, guardAnswer } from "@/lib/board/guard";
import { matchLocation } from "@/lib/extract/location";
import { groupIncidents, incidentKey, parseIncidentKey } from "@/lib/extract/group";
import { buildTimeline, canTransition, transitionSteps } from "@/lib/domain/status";
import { generatePublicCode, normalizePublicCode } from "@/lib/domain/code";

const board: BoardContent = {
  shelters: [
    {
      id: "p1",
      name: "Balai Desa Taba Terunjam",
      location: "Jl. Lintas Kepahiang",
      note: "kapasitas 80 orang",
    },
  ],
  aidPoints: [
    {
      id: "b1",
      kind: "air_bersih",
      name: "Tandon air",
      location: "depan Masjid Al Ikhlas",
      hours: "07.00-17.00",
      note: "",
    },
    {
      id: "b2",
      kind: "pos_kesehatan",
      name: "Pos kesehatan Puskesmas Karang Tinggi",
      location: "Balai Desa",
      hours: "24 jam",
      note: "",
    },
  ],
  announcedNeeds: [{ id: "k1", text: "Selimut dan popok bayi" }],
  contacts: [{ id: "c1", name: "Posko Desa (nomor contoh)", phone: "0812-0000-0101", note: "" }],
  notes: [],
};
const items = boardItems(board);

describe("penjaga jawaban", () => {
  it("meloloskan jawaban yang didukung butir", () => {
    const r = guardAnswer(
      {
        answer: "Air bersih ada di Tandon air depan Masjid Al Ikhlas, buka 07.00-17.00.",
        usedItems: ["b1"],
        found: true,
      },
      items,
    );
    expect(r.ok).toBe(true);
  });

  it("menolak butir yang tidak ada", () => {
    expect(guardAnswer({ answer: "x", usedItems: ["zz"], found: true }, items).ok).toBe(false);
  });

  it("menolak jam yang tidak ada di butir", () => {
    const r = guardAnswer(
      { answer: "Tandon air buka sampai 20.00.", usedItems: ["b1"], found: true },
      items,
    );
    expect(r).toMatchObject({ ok: false });
  });

  it("menolak nama tempat karangan", () => {
    const r = guardAnswer(
      {
        answer: "Silakan mengungsi ke Gedung Serbaguna Pondok Kelapa.",
        usedItems: ["p1"],
        found: true,
      },
      items,
    );
    expect(r.ok).toBe(false);
  });

  it("menolak nama tempat yang ada di butir lain tapi tidak dirujuk", () => {
    const r = guardAnswer(
      { answer: "Ada pos kesehatan di Puskesmas Karang Tinggi.", usedItems: ["p1"], found: true },
      items,
    );
    expect(r.ok).toBe(false);
  });

  it("found=false selalu ditolak", () => {
    expect(guardAnswer({ answer: "Belum ada.", usedItems: [], found: false }, items).ok).toBe(
      false,
    );
  });

  it("tanpa rujukan ditolak", () => {
    expect(guardAnswer({ answer: "Ke balai desa.", usedItems: [], found: true }, items).ok).toBe(
      false,
    );
  });

  it("frasa kapital mengabaikan kata umum dan awal kalimat", () => {
    expect(capitalizedPhrases("Silakan ke Balai Desa Taba Terunjam. Buka setiap hari.")).toEqual([
      "Balai Taba Terunjam",
    ]);
  });
});

describe("butir relevan tanpa AI", () => {
  it("posko terdekat mengarah ke pengungsian", () => {
    expect(findRelevantItems("Di mana posko terdekat?", items)[0]?.id).toBe("p1");
  });
  it("air bersih mengarah ke titik air", () => {
    expect(findRelevantItems("ambil air bersih dimana", items)[0]?.id).toBe("b1");
  });
  it("berobat mengarah ke pos kesehatan", () => {
    expect(findRelevantItems("mau berobat", items)[0]?.id).toBe("b2");
  });
  it("pertanyaan kosong tidak menghasilkan butir", () => {
    expect(findRelevantItems("di mana?", items)).toEqual([]);
  });
});

describe("pencocokan lokasi", () => {
  const villages = [
    { code: "17.09.01.2001", name: "Taba Terunjam", districtName: "Karang Tinggi" },
    { code: "17.09.01.2002", name: "Talang Empat", districtName: "Karang Tinggi" },
    { code: "17.09.02.2001", name: "Talang Empat", districtName: "Talang Empat" },
    { code: "17.09.03.2009", name: "Talang Pauh", districtName: "Pondok Kelapa" },
    { code: "17.09.03.2010", name: "Srikaton", districtName: "Pondok Kelapa" },
  ];

  it("nama persis dengan awalan desa", () => {
    expect(matchLocation("ds. Srikaton rt 2", villages)).toMatchObject({
      kind: "cocok",
      village: { code: "17.09.03.2010" },
    });
  });
  it("salah ketik kecil tetap cocok", () => {
    expect(matchLocation("taba terunjem", villages)).toMatchObject({
      kind: "cocok",
      village: { code: "17.09.01.2001" },
    });
  });
  it("nama kembar di dua kecamatan ambigu", () => {
    expect(matchLocation("desa talang empat", villages).kind).toBe("ambigu");
  });
  it("nama kembar dipisahkan oleh kecamatan", () => {
    expect(matchLocation("talang empat kec karang tinggi", villages)).toMatchObject({
      kind: "cocok",
      village: { code: "17.09.01.2002" },
    });
  });
  it("teks tanpa nama desa", () => {
    expect(matchLocation("di belakang pasar", villages).kind).toBe("tidak_ada");
    expect(matchLocation(null, villages).kind).toBe("tidak_ada");
  });
});

describe("pengelompokan kejadian dan angka berbeda", () => {
  const base = { source: "form" as const, hazard: "banjir" as const, villageCode: "17.09.01.2001" };
  const claim = (value: number, quote: string, messageId: string) => ({
    messageId,
    locationText: "Taba Terunjam",
    hazard: "banjir" as const,
    field: "mengungsi_kk" as const,
    value,
    approximate: false,
    quote,
  });

  it("mengelompokkan per desa dan jenis bencana serta menandai angka berbeda", () => {
    const groups = groupIncidents([
      {
        ...base,
        id: "r1",
        publicCode: "A",
        at: "2026-11-14T21:00",
        claims: [claim(12, "12 kk", "r1")],
      },
      {
        ...base,
        id: "r2",
        publicCode: "B",
        at: "2026-11-14T21:10",
        claims: [claim(15, "15 kk", "r2")],
      },
      {
        ...base,
        id: "r3",
        publicCode: "C",
        at: "2026-11-14T21:20",
        claims: [claim(12, "12 KK", "r3")],
      },
      {
        ...base,
        id: "r4",
        publicCode: "D",
        at: "2026-11-14T21:30",
        hazard: "tanah_longsor",
        claims: [],
      },
      { ...base, id: "r5", publicCode: "E", at: "2026-11-14T21:30", villageCode: null, claims: [] },
    ]);
    expect(groups).toHaveLength(2);
    const flood = groups[0]!;
    expect(flood.key).toBe(incidentKey("17.09.01.2001", "banjir"));
    expect(flood.reportIds).toEqual(["r1", "r2", "r3"]);
    expect(flood.differingCount).toBe(1);
    const field = flood.fields[0]!;
    expect(field.differs).toBe(true);
    expect(field.values.map((v) => [v.value, v.evidence.length])).toEqual([
      [12, 2],
      [15, 1],
    ]);
  });

  it("kunci kejadian bisa dibaca balik", () => {
    expect(parseIncidentKey(incidentKey("17.09.01.2001", "banjir_bandang"))).toEqual({
      villageSlug: "1709012001",
      hazard: "banjir_bandang",
    });
    expect(parseIncidentKey("bukan-kunci!")).toBeNull();
  });
});

describe("status laporan", () => {
  it("transisi yang diizinkan", () => {
    expect(canTransition("diterima", "dibaca")).toBe(true);
    expect(canTransition("dibaca", "diterima")).toBe(false);
    expect(canTransition("resmi", "resmi")).toBe(false);
  });

  it("lompat ke status akhir tetap mencatat dibaca", () => {
    expect(transitionSteps("diterima", "resmi")).toEqual(["dibaca", "resmi"]);
    expect(transitionSteps("dibaca", "perlu_konfirmasi")).toEqual(["perlu_konfirmasi"]);
    expect(transitionSteps("dibaca", "diterima")).toEqual([]);
  });

  it("linimasa memakai status akhir terbaru", () => {
    const t = buildTimeline([
      { status: "diterima", createdAt: "a" },
      { status: "dibaca", createdAt: "b" },
      { status: "perlu_konfirmasi", createdAt: "c" },
      { status: "resmi", createdAt: "d" },
    ]);
    expect(t.map((s) => [s.label, s.done, s.at])).toEqual([
      ["Diterima", true, "a"],
      ["Dibaca petugas", true, "b"],
      ["Masuk laporan resmi", true, "d"],
    ]);
  });

  it("linimasa baru hanya Diterima yang selesai", () => {
    const t = buildTimeline([{ status: "diterima", createdAt: "a" }]);
    expect(t.map((s) => s.done)).toEqual([true, false, false]);
  });
});

describe("kode laporan", () => {
  it("format TS-XXXX-XXXX tanpa huruf/angka yang mirip", () => {
    let seed = 0;
    const bytes = (n: number) =>
      Uint8Array.from({ length: n }, () => (seed = (seed * 37 + 11) % 256));
    const code = generatePublicCode(bytes);
    expect(code).toMatch(/^TS-[2-9A-HJKMNP-TV-Z]{4}-[2-9A-HJKMNP-TV-Z]{4}$/);
  });

  it("merapikan kode yang diketik", () => {
    expect(normalizePublicCode(" ts 7k4q 9m2x ")).toBe("TS-7K4Q-9M2X");
    expect(normalizePublicCode("7K4Q-9M2X")).toBe("TS-7K4Q-9M2X");
    expect(normalizePublicCode("TS-7K4Q-9M2")).toBeNull();
    expect(normalizePublicCode("TS-OOOO-1111")).toBeNull();
  });
});
