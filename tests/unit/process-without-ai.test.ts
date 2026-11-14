import { describe, expect, it } from "vitest";
import { getStore } from "@/lib/db";
import { buildFormReport, reportFormSchema } from "@/lib/reports/create";
import { processReport } from "@/lib/reports/process";

// Gerbang Fase 2: laporan tetap tersimpan dan berurgensi dari aturan saat AI mati.
describe("pemrosesan tanpa AI", () => {
  it("laporan tetap ada, urgensi dari aturan, menunggu AI", async () => {
    delete process.env.GROQ_API_KEY;
    delete process.env.GEMINI_API_KEY;
    const scope = { demoSessionId: null, regencyCode: "17.09" };
    const input = reportFormSchema.parse({
      villageCode: "17.09.01.2001",
      needs: ["makanan"],
      vulnerable: [],
      story: "kakek trjebak di loteng",
      forSelf: false,
      phone: null,
      consent: true,
    });
    const { report, event } = buildFormReport(input, {
      id: "00000000-0000-4000-8000-000000000001",
      publicCode: "TS-TEST-2345",
      now: new Date(),
      demoSessionId: null,
    });
    const store = getStore();
    expect(store.kind).toBe("memori");
    await store.insertReports([report], scope);
    await store.addEvents([event]);

    expect(await processReport(report.id, scope)).toBe("menunggu");
    const saved = await store.getReport(report.id, scope);
    expect(saved).toMatchObject({
      urgency: "tinggi",
      urgencySource: "aturan",
      aiState: "menunggu",
    });
    expect(saved?.urgencyQuote).toBe("trjebak");
  });
});
