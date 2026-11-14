import { describe, expect, it } from "vitest";
import type { Claim } from "@/lib/domain/types";
import { verifiedQuoteOrNull, verifyClaims } from "@/lib/extract/verify";
import { locateQuote, normalizeText } from "@/lib/text/normalize";
import { checkNumbersSupported, numbersInText } from "@/lib/text/numbers";

const claim = (over: Partial<Claim>): Claim => ({
  messageId: "m1",
  locationText: "Taba Terunjam",
  hazard: "banjir",
  field: "mengungsi_kk",
  value: 12,
  approximate: false,
  quote: "12 kk ngungsi",
  ...over,
});

describe("normalisasi dan lokasi kutipan", () => {
  it("menyeragamkan huruf, spasi, dan tanda kutip", () => {
    expect(normalizeText("  “Air”   NAIK\n\tlagi ")).toBe('"air" naik lagi');
  });

  it("menemukan posisi kutipan di teks asli", () => {
    const src = "Pak,  sdh 12 KK ngungsi ke balai";
    const r = locateQuote(src, "12 kk ngungsi");
    expect(r).not.toBeNull();
    expect(src.slice(r!.start, r!.end)).toBe("12 KK ngungsi");
  });

  it("mengabaikan tanda kutip pembungkus dari model", () => {
    expect(locateQuote("air setinggi pinggang", '"air setinggi pinggang."')).not.toBeNull();
  });

  it("menolak kutipan yang tidak ada", () => {
    expect(locateQuote("air setinggi pinggang", "air setinggi dada")).toBeNull();
    expect(locateQuote("apa saja", "")).toBeNull();
  });
});

describe("angka di teks", () => {
  it.each([
    ["12 kk", [12]],
    ["1.200 jiwa", [1200]],
    ["tiga KK", [3]],
    ["dua puluh lima rumah", [25]],
    ["sebelas orang", [11]],
    ["tiga ratus dua puluh lima", [325]],
    ["dua belas", [12]],
    ["seratus dua", [102]],
    ["dua ribu", [2000]],
    ["jam 21.00", [21, 0]],
  ])("%s", (text, expected) => {
    expect(numbersInText(text)).toEqual(expected);
  });

  it("'puluhan' dan 'banyak' bukan angka", () => {
    expect(numbersInText("puluhan rumah, banyak warga")).toEqual([]);
  });

  it("penjaga angka menolak angka tanpa saksi", () => {
    expect(checkNumbersSupported("12 KK mengungsi", ["sdh 12 kk ngungsi"]).ok).toBe(true);
    const bad = checkNumbersSupported("15 KK mengungsi, 2 meninggal", ["sdh 12 kk ngungsi"]);
    expect(bad.ok).toBe(false);
    expect(bad.unsupported).toEqual([15, 2]);
  });
});

describe("verifikasi klaim", () => {
  const sources = { m1: "Pak, di Taba Terunjam sdh 12 kk ngungsi, tiga rumah hanyut" };

  it("menyimpan klaim yang kutipan dan angkanya cocok", () => {
    const { kept, dropped } = verifyClaims([claim({})], sources);
    expect(kept).toHaveLength(1);
    expect(dropped).toHaveLength(0);
  });

  it("menerima kata bilangan di kutipan", () => {
    const c = claim({ field: "rumah_rusak_berat", value: 3, quote: "tiga rumah hanyut" });
    expect(verifyClaims([c], sources).kept).toHaveLength(1);
  });

  it("membuang kutipan karangan", () => {
    const { dropped } = verifyClaims([claim({ quote: "15 kk mengungsi" })], sources);
    expect(dropped[0]?.reason).toBe("kutipan tidak ada di pesan sumber");
  });

  it("membuang angka yang tidak ada di kutipan", () => {
    const { dropped } = verifyClaims([claim({ value: 15 })], sources);
    expect(dropped[0]?.reason).toBe("angka tidak ada di kutipan");
  });

  it("membuang klaim dari pesan yang tidak dikenal", () => {
    expect(verifyClaims([claim({ messageId: "m9" })], sources).dropped).toHaveLength(1);
  });

  it("membuang nilai hitungan yang bukan angka", () => {
    expect(verifyClaims([claim({ value: "puluhan" })], sources).dropped).toHaveLength(1);
  });

  it("field teks tidak perlu angka tapi kutipan tetap wajib", () => {
    const c = claim({
      field: "kondisi_terkini",
      value: "rumah hanyut",
      quote: "tiga rumah hanyut",
    });
    expect(verifyClaims([c], sources).kept).toHaveLength(1);
  });

  it("kutipan urgensi AI dipakai hanya jika ada di cerita", () => {
    expect(verifiedQuoteOrNull("nenek tdk bisa keluar", "Tdk bisa keluar")).toBe("tdk bisa keluar");
    expect(verifiedQuoteOrNull("nenek tdk bisa keluar", "kakek terjebak")).toBeNull();
    expect(verifiedQuoteOrNull("apa saja", null)).toBeNull();
  });
});
