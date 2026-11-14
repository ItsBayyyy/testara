import { processReport } from "@/lib/reports/process";
import { getRequestScope } from "@/lib/server/scope";

// Dipanggil klien setelah laporan tersimpan, dan oleh antrean petugas untuk
// laporan yang belum terproses. Pelapor tidak pernah menunggu route ini.
export async function POST(_request: Request, ctx: RouteContext<"/api/reports/[id]/process">) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return Response.json({ error: "id" }, { status: 400 });
  const scope = await getRequestScope();
  try {
    const state = await processReport(id, scope);
    if (state === null) return Response.json({ error: "tidak_ada" }, { status: 404 });
    return Response.json({ aiState: state });
  } catch {
    // Laporan tetap aman tersimpan; hanya perapian AI yang tertunda.
    return Response.json({ aiState: "menunggu" }, { status: 503 });
  }
}
