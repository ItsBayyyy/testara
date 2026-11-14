import { getStore } from "@/lib/db";

// Status layanan tanpa membocorkan kunci: hanya ya/tidak per komponen.
export async function GET() {
  const store = getStore();
  let database: "ok" | "gagal" = "gagal";
  try {
    database = (await store.ping()) ? "ok" : "gagal";
  } catch {
    database = "gagal";
  }
  return Response.json(
    {
      database,
      storage: store.kind,
      providers: {
        groq: Boolean(process.env.GROQ_API_KEY),
        gemini: Boolean(process.env.GEMINI_API_KEY),
      },
      auth: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
      time: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
