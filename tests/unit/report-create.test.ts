import { describe, expect, it } from "vitest";
import { buildFormReport, fieldErrors, reportFormSchema } from "@/lib/reports/create";
import { quickValidate, EMPTY_DRAFT } from "@/lib/reports/draft";

const valid = {
  villageCode: "17.09.01.2001",
  needs: ["evakuasi"],
  vulnerable: ["lansia"],
  story: "nenek tdk bisa keluar rmh",
  forSelf: false,
  phone: "0812 0000 1234",
  consent: true,
};

describe("validasi formulir lapor", () => {
  it("menerima isian lengkap", () => {
    expect(reportFormSchema.safeParse(valid).success).toBe(true);
  });

  it("wajib kebutuhan atau cerita", () => {
    const r = reportFormSchema.safeParse({ ...valid, needs: [], story: "  " });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).needs).toMatch(/minimal satu kebutuhan/);
  });

  it("boleh hanya tombol kebutuhan tanpa cerita", () => {
    expect(reportFormSchema.safeParse({ ...valid, story: "" }).success).toBe(true);
  });

  it("tanpa desa, cerita wajib ada", () => {
    const r = reportFormSchema.safeParse({ ...valid, villageCode: null, story: "" });
    expect(r.success).toBe(false);
  });

  it("persetujuan wajib", () => {
    const r = reportFormSchema.safeParse({ ...valid, consent: false });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).consent).toMatch(/Centang persetujuan/);
  });

  it("nomor HP kosong menjadi null, nomor aneh ditolak", () => {
    const empty = reportFormSchema.parse({ ...valid, phone: "  " });
    expect(empty.phone).toBeNull();
    expect(reportFormSchema.safeParse({ ...valid, phone: "abc" }).success).toBe(false);
    expect(reportFormSchema.safeParse({ ...valid, phone: "0812" }).success).toBe(false);
  });

  it("kebutuhan di luar daftar ditolak", () => {
    expect(reportFormSchema.safeParse({ ...valid, needs: ["helikopter"] }).success).toBe(false);
  });

  it("validasi cepat di perangkat memberi pesan yang sama", () => {
    expect(quickValidate(EMPTY_DRAFT)).toMatchObject({
      needs: "Pilih minimal satu kebutuhan, atau tulis ceritanya.",
      consent: "Centang persetujuan agar laporan bisa disimpan.",
    });
    expect(
      quickValidate({ ...EMPTY_DRAFT, needs: ["makanan"], villageCode: "x", consent: true }),
    ).toEqual({});
  });
});

describe("laporan baru", () => {
  it("tersimpan dengan status Diterima, urgensi dari aturan, dan kedaluwarsa 30 hari", () => {
    const input = reportFormSchema.parse(valid);
    const now = new Date("2026-11-14T14:00:00Z");
    const { report, event } = buildFormReport(input, {
      id: "r1",
      publicCode: "TS-AAAA-BBBB",
      now,
      demoSessionId: null,
    });
    expect(report).toMatchObject({
      status: "diterima",
      urgency: "tinggi",
      urgencySource: "aturan",
      aiState: "menunggu",
      source: "form",
      reporterPhone: "0812 0000 1234",
      expiresAt: "2026-12-14T14:00:00.000Z",
    });
    expect(event).toEqual({
      reportId: "r1",
      status: "diterima",
      actor: "system",
      createdAt: now.toISOString(),
    });
  });
});
