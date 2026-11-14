import { describe, expect, it } from "vitest";
import type { AskOut } from "@/lib/ai/schemas";
import { answerQuestion } from "@/lib/board/ask";
import { cleanBoard } from "@/lib/board/schema";
import { suggestFromNeeds, verifySuggestions } from "@/lib/board/suggest";
import { getStore } from "@/lib/db";
import type { BoardContent } from "@/lib/domain/types";

// Gerbang Fase 4: jawaban yang tidak didukung papan selalu diganti
// "belum ada informasi resmi" beserta butir yang paling relevan.

const scope = { demoSessionId: "11111111-1111-4111-8111-111111111111", regencyCode: "17.09" };
const VILLAGE = "17.09.01.2001"; // Taba Terunjam, Kec. Karang Tinggi
const NEIGHBOR = "17.09.01.2002"; // desa lain di kecamatan yang sama

const content: BoardContent = cleanBoard({
  shelters: [
    { id: "x", name: "Balai Desa Taba Terunjam", location: "Jl. Lintas Kepahiang", note: "" },
  ],
  aidPoints: [
    {
      id: "x",
      kind: "air_bersih",
      name: "Tandon air",
      location: "depan Masjid Al Ikhlas",
      hours: "07.00-17.00",
      note: "",
    },
  ],
  announcedNeeds: [],
  contacts: [{ id: "x", name: "Posko Desa (nomor contoh)", phone: "0812-0000-0101", note: "" }],
  notes: [],
});

async function publish(villageCode: string, c: BoardContent) {
  await getStore().publishBoard(
    {
      id: `v-${villageCode}`,
      demoSessionId: scope.demoSessionId,
      villageCode,
      content: c,
      publishedAt: new Date().toISOString(),
      publishedBy: "uji",
    },
    scope,
  );
}

const fakeAi = (data: AskOut) =>
  (async () => ({ data, provider: "palsu", model: "palsu", cached: false })) as never;
const noAi = (async () => ({ reason: "tidak_dikonfigurasi" })) as never;

describe("tanya papan info", () => {
  it("tanpa papan terbit: belum ada informasi", async () => {
    const r = await answerQuestion("posko di mana?", "17.09.11.2001", scope, noAi);
    expect(r).toMatchObject({ kind: "belum_ada", items: [] });
  });

  it("jawaban yang didukung papan diteruskan beserta butirnya", async () => {
    await publish(VILLAGE, content);
    const r = await answerQuestion(
      "ambil air bersih di mana?",
      VILLAGE,
      scope,
      fakeAi({
        answer: "Air bersih ada di Tandon air depan Masjid Al Ikhlas, buka 07.00-17.00.",
        usedItems: ["b1"],
        found: true,
      }),
    );
    expect(r.kind).toBe("jawaban");
    if (r.kind === "jawaban") expect(r.items.map((i) => i.id)).toEqual(["b1"]);
  });

  it.each([
    ["jam karangan", { answer: "Tandon air buka 24 jam.", usedItems: ["b1"], found: true }],
    [
      "tempat karangan",
      { answer: "Mengungsi ke Gedung Serbaguna Kecamatan.", usedItems: ["p1"], found: true },
    ],
    ["butir tidak ada", { answer: "Ke balai desa.", usedItems: ["p9"], found: true }],
    ["tanpa rujukan", { answer: "Ke balai desa.", usedItems: [], found: true }],
    ["model bilang tidak ada", { answer: "", usedItems: [], found: false }],
    ["nomor karangan", { answer: "Hubungi 0812-9999-0000.", usedItems: ["c1"], found: true }],
  ])("%s diganti belum ada informasi resmi", async (_name, out) => {
    await publish(VILLAGE, content);
    const r = await answerQuestion("posko terdekat di mana?", VILLAGE, scope, fakeAi(out));
    expect(r.kind).toBe("belum_ada");
    if (r.kind === "belum_ada") {
      expect(r.contacts[0]?.phone).toBe("0812-0000-0101");
      expect(r.items[0]?.id).toBe("p1");
    }
  });

  it("nomor darurat boleh disebut walau tidak ada di papan", async () => {
    await publish(VILLAGE, content);
    const r = await answerQuestion(
      "ada yang pingsan",
      VILLAGE,
      scope,
      fakeAi({
        answer: "Telepon 112 sekarang. Pos kesehatan belum ada di papan.",
        usedItems: ["c1"],
        found: true,
      }),
    );
    expect(r.kind).toBe("jawaban");
  });

  it("AI mati: tampilkan butir relevan tanpa jawaban AI", async () => {
    await publish(VILLAGE, content);
    const r = await answerQuestion("posko terdekat?", VILLAGE, scope, noAi);
    expect(r).toMatchObject({ kind: "belum_ada", aiUsed: false });
    if (r.kind === "belum_ada") expect(r.items[0]?.id).toBe("p1");
  });

  it("butir desa tetangga sekecamatan diberi awalan dan bisa dirujuk", async () => {
    await publish(VILLAGE, content);
    await publish(
      NEIGHBOR,
      cleanBoard({
        ...content,
        shelters: [{ id: "x", name: "SD Negeri 5", location: "", note: "" }],
      }),
    );
    const r = await answerQuestion(
      "pengungsian lain?",
      VILLAGE,
      scope,
      fakeAi({ answer: "Ada juga di SD Negeri 5.", usedItems: ["1709012002-p1"], found: true }),
    );
    expect(r.kind).toBe("jawaban");
  });
});

describe("isi dan usulan papan", () => {
  it("baris kosong dibuang dan ID dirapikan", () => {
    const c = cleanBoard({
      shelters: [
        { id: "a", name: "", location: "", note: "" },
        { id: "b", name: "Masjid", location: "", note: "" },
      ],
      aidPoints: [],
      announcedNeeds: [{ id: "z", text: "Selimut" }],
      contacts: [],
      notes: [{ id: "q", text: "" }],
    });
    expect(c.shelters).toEqual([{ id: "p1", name: "Masjid", location: "", note: "" }]);
    expect(c.announcedNeeds).toEqual([{ id: "k1", text: "Selimut" }]);
    expect(c.notes).toEqual([]);
  });

  it("usulan tanpa AI dari kebutuhan laporan resmi", () => {
    const s = suggestFromNeeds([{ needs: ["air_bersih", "makanan"] }, { needs: ["air_bersih"] }]);
    expect(s.map((x) => [x.text, x.source])).toEqual([
      ["Air bersih", "dipilih di 2 laporan resmi"],
      ["Makanan", "dipilih di 1 laporan resmi"],
    ]);
  });

  it("usulan AI tanpa kutipan atau dengan angka karangan dibuang", () => {
    const sources = ["jembatan ke dusun 2 putus, 20 kk butuh selimut"];
    const s = verifySuggestions(
      {
        announcedNeeds: [
          { text: "Selimut untuk 20 KK", quote: "20 kk butuh selimut" },
          { text: "Selimut untuk 50 KK", quote: "20 kk butuh selimut" },
          { text: "Popok bayi", quote: "butuh popok" },
        ],
        notes: [{ text: "Jembatan ke dusun 2 putus", quote: "jembatan ke dusun 2 putus" }],
      },
      sources,
    );
    expect(s.map((x) => x.text)).toEqual(["Selimut untuk 20 KK", "Jembatan ke dusun 2 putus"]);
  });
});
