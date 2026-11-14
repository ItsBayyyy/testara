import { z } from "zod";
import { answerQuestion } from "@/lib/board/ask";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getRequestScope } from "@/lib/server/scope";
import { findVillage } from "@/lib/wilayah";

const bodySchema = z.object({
  villageCode: z.string().min(1).max(20),
  question: z.string().trim().min(3).max(300),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !findVillage(parsed.data.villageCode)) {
    return Response.json(
      { error: "isian", message: "Tulis pertanyaan minimal 3 huruf." },
      { status: 400 },
    );
  }
  const limit = await checkRateLimit("tanya", request.headers);
  if (!limit.allowed) {
    return Response.json(
      {
        error: "batas",
        message: `Sudah 20 pertanyaan dari jaringan ini dalam satu jam. Coba lagi sekitar ${limit.retryAfterMinutes} menit lagi, atau baca papan info di bawah.`,
      },
      { status: 429 },
    );
  }
  const scope = await getRequestScope();
  try {
    return Response.json(
      await answerQuestion(parsed.data.question, parsed.data.villageCode, scope),
    );
  } catch {
    return Response.json(
      {
        error: "server",
        message: "Pertanyaan belum bisa dijawab sekarang. Baca papan info di bawah.",
      },
      { status: 503 },
    );
  }
}
