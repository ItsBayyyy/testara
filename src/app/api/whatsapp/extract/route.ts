import { randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import { callAi, isAiFailure } from "@/lib/ai";
import { VILLAGE_SYSTEM, villageUser } from "@/lib/ai/prompts/village";
import { PROMPT_VERSION } from "@/lib/ai/prompts/version";
import { WHATSAPP_SYSTEM, whatsappUser } from "@/lib/ai/prompts/whatsapp";
import { villagePickOut, whatsappExtractionOut } from "@/lib/ai/schemas";
import { getStaff, staffScope } from "@/lib/auth/staff";
import { getStore } from "@/lib/db";
import { generatePublicCode } from "@/lib/domain/code";
import { wibLocalToIso } from "@/lib/format";
import { maskPhoneNumbers } from "@/lib/privacy/mask";
import { buildWhatsappReports } from "@/lib/reports/whatsapp";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { listVillages } from "@/lib/wilayah";

const bodySchema = z.object({
  first: z.boolean(),
  messages: z
    .array(
      z.object({
        id: z.string().max(20),
        sender: z.string().max(80).nullable(),
        sentAt: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
          .nullable(),
        text: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(20),
});

// Satu panggilan = satu batch (maks. 20 pesan), supaya progres terlihat di layar
// petugas dan tidak terkena batas durasi fungsi serverless.
export async function POST(request: Request) {
  const staff = await getStaff();
  if (!staff) return Response.json({ error: "masuk" }, { status: 401 });
  const scope = staffScope(staff);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "isian" }, { status: 400 });

  if (parsed.data.first) {
    const limit = await checkRateLimit("whatsapp", request.headers);
    if (!limit.allowed) {
      return Response.json(
        {
          error: "batas",
          message: `Batas 10 kali proses tempel WhatsApp per jam tercapai. Coba lagi sekitar ${limit.retryAfterMinutes} menit lagi.`,
        },
        { status: 429 },
      );
    }
  }

  // Disamarkan ulang di server untuk berjaga-jaga; nama pengirim tidak dikirim ke AI.
  const messages = parsed.data.messages.map((m) => ({ ...m, text: maskPhoneNumbers(m.text) }));
  const ai = await callAi({
    task: "whatsapp",
    system: WHATSAPP_SYSTEM,
    user: whatsappUser(
      messages.map((m) => ({ id: m.id, time: m.sentAt?.slice(11) ?? null, text: m.text })),
    ),
    schema: whatsappExtractionOut,
  });
  const aiOk = !isAiFailure(ai);

  const villages = listVillages().map((v) => ({
    code: v.code,
    name: v.name,
    districtName: v.districtName,
  }));
  const built = buildWhatsappReports(messages, aiOk ? ai.data : null, {
    newId: () => randomUUID(),
    newCode: () => generatePublicCode((n) => randomBytes(n)),
    now: new Date(),
    demoSessionId: scope.demoSessionId,
    villages,
    toIso: wibLocalToIso,
    meta: aiOk ? { provider: ai.provider, model: ai.model, promptVersion: PROMPT_VERSION } : null,
  });

  // Hanya untuk nama desa yang ambigu, LLM memilih dari kandidat yang diberikan.
  if (aiOk) {
    for (const amb of built.ambiguous) {
      const pick = await callAi({
        task: "desa",
        system: VILLAGE_SYSTEM,
        user: villageUser(
          maskPhoneNumbers(amb.locationText),
          amb.candidates.map((c) => ({
            code: c.code,
            label: `${c.name}, Kecamatan ${c.districtName}`,
          })),
        ),
        schema: villagePickOut,
      });
      const code = isAiFailure(pick) ? null : pick.data.code;
      const report = built.reports.find((r) => r.id === amb.reportId);
      if (report && code && amb.candidates.some((c) => c.code === code)) report.villageCode = code;
    }
  }

  const store = getStore();
  try {
    if (built.reports.length > 0) {
      await store.insertReports(built.reports, scope);
      await store.addEvents(built.events);
    }
  } catch {
    return Response.json(
      { error: "server", message: "Pesan belum tersimpan. Coba lagi." },
      { status: 503 },
    );
  }
  return Response.json({ created: built.reports.length, skipped: built.skipped, ai: aiOk });
}
