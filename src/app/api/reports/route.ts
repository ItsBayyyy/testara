import { randomBytes, randomUUID } from "node:crypto";
import { getStore } from "@/lib/db";
import { generatePublicCode } from "@/lib/domain/code";
import { buildFormReport, fieldErrors, reportFormSchema } from "@/lib/reports/create";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getRequestScope } from "@/lib/server/scope";
import { findVillage } from "@/lib/wilayah";

// Simpan laporan dulu, AI belakangan: route ini tidak pernah memanggil AI,
// sehingga laporan tetap tersimpan walau penyedia AI sedang bermasalah.
export async function POST(request: Request) {
  const limit = await checkRateLimit("laporan", request.headers);
  if (!limit.allowed) {
    return Response.json(
      {
        error: "batas",
        message: `Sudah 5 laporan dari jaringan ini dalam satu jam. Coba lagi sekitar ${limit.retryAfterMinutes} menit lagi, atau kirim lewat WhatsApp.`,
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterMinutes * 60) } },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = reportFormSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "isian", fields: fieldErrors(parsed.error) }, { status: 400 });
  }
  if (parsed.data.villageCode && !findVillage(parsed.data.villageCode)) {
    return Response.json(
      { error: "isian", fields: { villageCode: "Desa tidak dikenal. Pilih dari daftar." } },
      { status: 400 },
    );
  }

  const scope = await getRequestScope();
  const store = getStore();
  const { report, event } = buildFormReport(parsed.data, {
    id: randomUUID(),
    publicCode: generatePublicCode((n) => randomBytes(n)),
    now: new Date(),
    demoSessionId: scope.demoSessionId,
  });

  try {
    await store.insertReports([report], scope);
    await store.addEvents([event]);
  } catch {
    return Response.json(
      {
        error: "server",
        message: "Laporan belum tersimpan. Coba lagi, atau kirim lewat WhatsApp.",
      },
      { status: 503 },
    );
  }

  return Response.json({ id: report.id, code: report.publicCode }, { status: 201 });
}
