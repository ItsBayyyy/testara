import { describe, expect, it } from "vitest";
import { maskPhoneNumbers } from "@/lib/privacy/mask";
import { parseWhatsAppExport, toBatches } from "@/lib/whatsapp/parse";
import {
  buildFallbackReportMessage,
  buildIncidentSummary,
  whatsappLink,
} from "@/lib/whatsapp/format";

describe("parser ekspor WhatsApp", () => {
  it("format Android Indonesia 24 jam dengan titik", () => {
    const input = [
      "14/11/26 20.58 - Pesan dan panggilan terenkripsi secara end-to-end. Tidak seorang pun di luar chat ini dapat membaca.",
      "14/11/26 21.02 - Pak Kades Taba: Air sdh masuk rmh warga",
      "RT 3 paling parah",
      "14/11/26 21.05 - Bu Sekdes: <Media tidak disertakan>",
      "14/11/26 21.06 - Bu Sekdes: Pesan ini telah dihapus",
      "14/11/26 21.07 - Pak Kades menambahkan Andi",
      "14/11/26 21.10 - Andi: siap pak",
    ].join("\n");
    const r = parseWhatsAppExport(input);
    expect(r.format).toBe("android");
    expect(r.messages).toHaveLength(2);
    expect(r.messages[0]).toEqual({
      id: "m1",
      sender: "Pak Kades Taba",
      sentAt: "2026-11-14T21:02",
      text: "Air sdh masuk rmh warga\nRT 3 paling parah",
    });
    expect(r.skipped).toBe(4);
  });

  it("format Android Inggris 12 jam", () => {
    const input =
      "11/14/26, 9:05 PM - Budi: water rising\n11/14/26, 12:15 AM - Budi: <Media omitted>";
    const r = parseWhatsAppExport(input);
    expect(r.messages).toEqual([
      { id: "m1", sender: "Budi", sentAt: "2026-11-14T21:05", text: "water rising" },
    ]);
  });

  it("format iPhone dengan detik dan karakter tak terlihat", () => {
    const input = [
      "‎[14/11/26 21.05.33] Pak RT: Jalan ke desa putus",
      "[14/11/26 21.06.10] Pak RT: ‎image omitted",
      "[11/14/26, 9:07:00 PM] Ani: ok",
    ].join("\n");
    const r = parseWhatsAppExport(input);
    expect(r.format).toBe("iphone");
    expect(r.messages.map((m) => m.text)).toEqual(["Jalan ke desa putus", "ok"]);
    expect(r.messages[1]?.sentAt).toBe("2026-11-14T21:07");
  });

  it("format dengan tahun empat digit dan koma", () => {
    const r = parseWhatsAppExport("14/11/2026, 21:02 - Kades: banjir");
    expect(r.messages[0]?.sentAt).toBe("2026-11-14T21:02");
  });

  it("pesan sistem perubahan nama grup dan keluar dilewati", () => {
    const input = [
      '14/11/26 21.00 - Pak Kades mengubah nama grup dari "A" menjadi "Siaga Banjir"',
      "14/11/26 21.01 - Andi keluar",
      "14/11/26 21.02 - Kades: laporan masuk",
    ].join("\n");
    expect(parseWhatsAppExport(input).messages).toHaveLength(1);
  });

  it("format tak dikenal: tiap baris tak kosong satu pesan tanpa jam", () => {
    const r = parseWhatsAppExport("air naik\n\nwarga mengungsi ke masjid\n");
    expect(r.format).toBe("baris");
    expect(r.messages).toEqual([
      { id: "m1", sender: null, sentAt: null, text: "air naik" },
      { id: "m2", sender: null, sentAt: null, text: "warga mengungsi ke masjid" },
    ]);
  });

  it("menangani CRLF", () => {
    const r = parseWhatsAppExport("14/11/26 21.02 - A: satu\r\n14/11/26 21.03 - B: dua\r\n");
    expect(r.messages.map((m) => m.text)).toEqual(["satu", "dua"]);
  });

  it("batch 18 pesan", () => {
    const b = toBatches(Array.from({ length: 40 }, (_, i) => i));
    expect(b.map((x) => x.length)).toEqual([18, 18, 4]);
  });
});

describe("penyamaran nomor HP", () => {
  it.each([
    ["hub 081234567890 ya", "hub [nomor disamarkan] ya"],
    ["wa +62 812-3456-7890", "wa [nomor disamarkan]"],
    ["62812.3456.789", "[nomor disamarkan]"],
    ["0812 0000 1234", "[nomor disamarkan]"],
  ])("%s", (input, expected) => {
    expect(maskPhoneNumbers(input)).toBe(expected);
  });

  it("tidak menyamarkan angka biasa", () => {
    const text = "12 kk, 2026, rt 08, jam 21.00, kode 17090120011";
    expect(maskPhoneNumbers(text)).toBe(text);
  });
});

describe("format pesan WhatsApp", () => {
  it("tautan wa.me dengan nomor 08 diubah ke 62", () => {
    expect(whatsappLink("0812-0000-0001", "a b")).toBe("https://wa.me/6281200000001?text=a%20b");
  });

  it("pesan cadangan korban memuat isi formulir", () => {
    const msg = buildFallbackReportMessage({
      villageLabel: "Desa Taba Terunjam",
      needs: ["evakuasi", "obat"],
      vulnerable: ["lansia"],
      story: "nenek tdk bisa keluar",
      forSelf: false,
      phone: null,
    });
    expect(msg).toContain("Desa: Desa Taba Terunjam");
    expect(msg).toContain("Kebutuhan: Evakuasi/terjebak, Obat/perawatan");
    expect(msg).toContain("Perlu didahulukan: Lansia");
    expect(msg).toContain("nenek tdk bisa keluar");
  });

  it("ringkasan kejadian memakai *tebal* dan menandai angka berbeda", () => {
    const s = buildIncidentSummary({
      villageLabel: "Desa Taba Terunjam",
      districtName: "Karang Tinggi",
      hazardLabel: "Banjir",
      reportCount: 3,
      values: [{ field: "mengungsi_kk", value: 12, approximate: true }],
      reviewedAt: null,
      differingLeft: 1,
    });
    expect(s).toContain("*Banjir di Desa Taba Terunjam, Kec. Karang Tinggi*");
    expect(s).toContain("- Mengungsi (KK): *sekitar 12*");
    expect(s).toContain("Masih ada 1 angka berbeda");
  });
});
