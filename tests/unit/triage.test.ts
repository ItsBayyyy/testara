import { describe, expect, it } from "vitest";
import {
  applyUrgencyRules,
  combineUrgency,
  findDangerKeyword,
  maxUrgency,
} from "@/lib/triage/rules";

describe("aturan urgensi", () => {
  it("evakuasi selalu tinggi", () => {
    const r = applyUrgencyRules({ needs: ["evakuasi"], vulnerable: [], text: "" });
    expect(r.urgency).toBe("tinggi");
  });

  it("orang rentan + obat menjadi tinggi", () => {
    const r = applyUrgencyRules({ needs: ["obat"], vulnerable: ["lansia"], text: "" });
    expect(r.urgency).toBe("tinggi");
  });

  it("orang rentan + evakuasi menjadi tinggi", () => {
    expect(
      applyUrgencyRules({ needs: ["evakuasi"], vulnerable: ["bayi_balita"], text: "" }).urgency,
    ).toBe("tinggi");
  });

  it("orang rentan tanpa evakuasi/obat cukup sedang", () => {
    const r = applyUrgencyRules({ needs: ["makanan"], vulnerable: ["ibu_hamil"], text: "aman" });
    expect(r.urgency).toBe("sedang");
  });

  it("obat tanpa orang rentan tidak otomatis tinggi", () => {
    expect(applyUrgencyRules({ needs: ["obat"], vulnerable: [], text: "" }).urgency).toBe("sedang");
  });

  it("tanpa kebutuhan dan tanpa tanda bahaya rendah", () => {
    expect(
      applyUrgencyRules({ needs: [], vulnerable: [], text: "hujan dari tadi sore" }).urgency,
    ).toBe("rendah");
    expect(applyUrgencyRules({ needs: ["lainnya"], vulnerable: [], text: "" }).urgency).toBe(
      "rendah",
    );
  });

  it.each([
    ["ada 3 org terjebak di loteng", "terjebak"],
    ["nenek tdk bisa keluar rmh", "tidak bisa keluar"],
    ["kakek ga bs keluar dr kamar", "tidak bisa keluar"],
    ["Mobil HANYUT dibawa arus", "hanyut"],
    ["rumah pak rt tertimbun tanah", "tertimbun"],
    ["anak saya sesak nafas", "sesak napas"],
    ["ibu pingsan tadi pagi", "pingsan"],
    ["ada yg luka parah di kaki", "luka parah"],
    ["pendarahan tidak berhenti", "pendarahan"],
    ["air sdh sampe atap", "air sampai atap"],
    ["trjebak di lantai 2", "terjebak"],
  ])("kata kunci bahaya: %s", (text, label) => {
    const r = applyUrgencyRules({ needs: [], vulnerable: [], text });
    expect(r.urgency).toBe("tinggi");
    expect(findDangerKeyword(text)?.label).toBe(label);
  });

  it("kutipan kata kunci diambil persis dari teks asli", () => {
    const text = "Tolong,  nenek  TDK bisa keluar rmh";
    expect(findDangerKeyword(text)?.quote).toBe("TDK bisa keluar");
  });

  it("tidak salah memicu pada kata yang mirip", () => {
    expect(findDangerKeyword("jebakan tikus di dapur")).toBeNull();
    expect(findDangerKeyword("saya bisa keluar rumah, aman")).toBeNull();
    expect(findDangerKeyword("darah tinggi kambuh")).toBeNull();
  });
});

describe("gabungan aturan dan AI", () => {
  const rule = { urgency: "sedang" as const, reason: "aturan", quote: null };

  it("AI boleh menaikkan", () => {
    const c = combineUrgency(rule, { urgency: "tinggi", reason: "ai", quote: "x" });
    expect(c).toMatchObject({ urgency: "tinggi", source: "ai" });
  });

  it("AI tidak boleh menurunkan", () => {
    const high = { urgency: "tinggi" as const, reason: "aturan", quote: "terjebak" };
    const c = combineUrgency(high, { urgency: "rendah", reason: "ai", quote: null });
    expect(c).toMatchObject({ urgency: "tinggi", source: "aturan", quote: "terjebak" });
  });

  it("tanpa AI memakai aturan", () => {
    expect(combineUrgency(rule, null)).toMatchObject({ urgency: "sedang", source: "aturan" });
  });

  it("maxUrgency", () => {
    expect(maxUrgency("rendah", "sedang")).toBe("sedang");
    expect(maxUrgency("tinggi", "sedang")).toBe("tinggi");
  });
});
