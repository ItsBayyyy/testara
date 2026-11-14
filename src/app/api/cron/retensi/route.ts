import { timingSafeEqual } from "node:crypto";
import { getStore } from "@/lib/db";

// Dipanggil GitHub Actions setiap hari: hapus laporan lewat 30 hari dan data demo
// lebih dari 24 jam. Panggilan yang sama menjaga proyek Supabase free tier tetap aktif.

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(request: Request) {
  if (!authorized(request)) return Response.json({ error: "tidak_berhak" }, { status: 401 });
  const now = new Date();
  try {
    const removed = await getStore().purge(now, new Date(now.getTime() - 24 * 60 * 60 * 1000));
    return Response.json({ ok: true, ...removed });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
