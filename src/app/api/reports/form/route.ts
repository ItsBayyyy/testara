import { after } from "next/server";
import { processReport } from "@/lib/reports/process";
import { formDataToInput, submitReport } from "@/lib/reports/submit";
import { getRequestScope } from "@/lib/server/scope";

// Penerima formulir HTML biasa, dipakai jika JavaScript belum termuat (sinyal lambat).
// Hasilnya selalu pengalihan halaman, bukan JSON.
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const result = form
    ? await submitReport(formDataToInput(form), request.headers)
    : ({ kind: "server", message: "" } as const);
  const to = (path: string) => Response.redirect(new URL(path, request.url), 303);

  if (result.kind === "ok") {
    // Tanpa JavaScript, klien tidak bisa memicu perapian AI; jalankan setelah respons terkirim.
    const scope = await getRequestScope();
    after(() => processReport(result.id, scope).catch(() => null));
    return to(`/status/${result.code}?baru=1`);
  }
  const reason = result.kind === "isian" ? Object.keys(result.fields).join(",") : result.kind;
  return to(`/lapor?galat=${encodeURIComponent(reason)}`);
}
