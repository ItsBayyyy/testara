import { describe, expect, it } from "vitest";
import { MemoryStore } from "@/lib/db/memory-store";
import type { Report } from "@/lib/domain/types";

const base = (over: Partial<Report>): Report => ({
  id: "x",
  publicCode: "TS-AAAA-AAAA",
  demoSessionId: null,
  villageCode: null,
  needs: [],
  vulnerable: [],
  forSelf: true,
  storyText: "",
  reporterPhone: null,
  source: "form",
  sourceMeta: null,
  status: "diterima",
  urgency: "rendah",
  urgencySource: "aturan",
  urgencyReason: "",
  urgencyQuote: null,
  aiState: "menunggu",
  extraction: null,
  createdAt: "2026-11-14T00:00:00.000Z",
  updatedAt: "2026-11-14T00:00:00.000Z",
  expiresAt: "2026-12-14T00:00:00.000Z",
  ...over,
});

describe("retensi data", () => {
  it("menghapus laporan kedaluwarsa dan data demo lebih dari 24 jam", async () => {
    globalThis.__testaraMemory = undefined;
    const store = new MemoryStore();
    const real = { demoSessionId: null, regencyCode: "17.09" };
    const demo = { demoSessionId: "d1", regencyCode: "17.09" };
    await store.insertReports(
      [base({ id: "lama", expiresAt: "2026-11-01T00:00:00.000Z" }), base({ id: "baru" })],
      real,
    );
    await store.insertReports(
      [
        base({ id: "demo-lama", demoSessionId: "d1", createdAt: "2026-11-13T00:00:00.000Z" }),
        base({ id: "demo-baru", demoSessionId: "d1", createdAt: "2026-11-15T00:00:00.000Z" }),
      ],
      demo,
    );
    await store.addEvents([
      { reportId: "lama", status: "diterima", actor: "system", createdAt: "t" },
    ]);

    const removed = await store.purge(
      new Date("2026-11-15T06:00:00Z"),
      new Date("2026-11-14T06:00:00Z"),
    );
    expect(removed).toEqual({ reports: 1, demo: 1 });
    expect((await store.listReports(real)).map((r) => r.id)).toEqual(["baru"]);
    expect((await store.listReports(demo)).map((r) => r.id)).toEqual(["demo-baru"]);
    expect(await store.listEvents("lama")).toEqual([]);
  });

  it("lingkup demo dan data sungguhan tidak tercampur", async () => {
    globalThis.__testaraMemory = undefined;
    const store = new MemoryStore();
    await store.insertReports([base({ id: "r" })], { demoSessionId: null, regencyCode: "17.09" });
    expect(await store.getReport("r", { demoSessionId: "d1", regencyCode: "17.09" })).toBeNull();
    expect(await store.getReport("r", { demoSessionId: null, regencyCode: "17.01" })).toBeNull();
    expect(
      await store.getReport("r", { demoSessionId: null, regencyCode: "17.09" }),
    ).not.toBeNull();
  });
});
