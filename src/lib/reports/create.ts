import { z } from "zod";
import { NEEDS, VULNERABLE, type Report, type ReportEvent } from "@/lib/domain/types";
import { applyUrgencyRules } from "@/lib/triage/rules";

// Validasi formulir lapor dan pembentukan laporan baru. Fungsi murni:
// waktu, ID, dan kode laporan disuntikkan supaya mudah diuji.

export const RETENTION_DAYS = 30;

const phone = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .refine((v) => v === null || /^[+\d][\d\s.-]{7,20}$/.test(v), {
    message: "Nomor HP hanya berisi angka, contoh 0812 3456 7890.",
  })
  .refine(
    (v) => v === null || (v.replace(/\D/g, "").length >= 9 && v.replace(/\D/g, "").length <= 15),
    {
      message: "Nomor HP terlalu pendek atau terlalu panjang.",
    },
  );

export const reportFormSchema = z
  .object({
    villageCode: z.string().trim().min(1).nullable(),
    needs: z.array(z.enum(NEEDS)).max(NEEDS.length),
    vulnerable: z.array(z.enum(VULNERABLE)).max(VULNERABLE.length),
    story: z.string().max(2000, { message: "Cerita terlalu panjang (maksimal 2.000 huruf)." }),
    forSelf: z.boolean(),
    phone: phone.optional().default(null),
    consent: z.literal(true, { message: "Centang persetujuan agar laporan bisa disimpan." }),
  })
  .superRefine((v, ctx) => {
    if (v.needs.length === 0 && v.story.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["needs"],
        message: "Pilih minimal satu kebutuhan, atau tulis ceritanya.",
      });
    }
    if (v.villageCode === null && v.story.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["story"],
        message: "Desa belum dipilih. Tulis lokasinya di cerita.",
      });
    }
  });

export type ReportFormInput = z.infer<typeof reportFormSchema>;

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

export type NewReportDeps = {
  id: string;
  publicCode: string;
  now: Date;
  demoSessionId: string | null;
};

export function buildFormReport(
  input: ReportFormInput,
  deps: NewReportDeps,
): { report: Report; event: ReportEvent } {
  const rule = applyUrgencyRules({
    needs: input.needs,
    vulnerable: input.vulnerable,
    text: input.story,
  });
  const now = deps.now.toISOString();
  const report: Report = {
    id: deps.id,
    publicCode: deps.publicCode,
    demoSessionId: deps.demoSessionId,
    villageCode: input.villageCode,
    needs: [...new Set(input.needs)],
    vulnerable: [...new Set(input.vulnerable)],
    forSelf: input.forSelf,
    storyText: input.story.trim(),
    reporterPhone: input.phone ?? null,
    source: "form",
    sourceMeta: null,
    status: "diterima",
    urgency: rule.urgency,
    urgencySource: "aturan",
    urgencyReason: rule.reason,
    urgencyQuote: rule.quote,
    aiState: "menunggu",
    extraction: null,
    createdAt: now,
    updatedAt: now,
    expiresAt: new Date(deps.now.getTime() + RETENTION_DAYS * 86_400_000).toISOString(),
  };
  return {
    report,
    event: { reportId: report.id, status: "diterima", actor: "system", createdAt: now },
  };
}
