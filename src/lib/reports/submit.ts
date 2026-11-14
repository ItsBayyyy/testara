import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { getStore } from "@/lib/db";
import { generatePublicCode } from "@/lib/domain/code";
import { matchLocation } from "@/lib/extract/location";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getRequestScope } from "@/lib/server/scope";
import { findVillage, listVillages } from "@/lib/wilayah";
import { buildFormReport, fieldErrors, reportFormSchema } from "./create";

export type SubmitResult =
  | { kind: "ok"; id: string; code: string }
  | { kind: "isian"; fields: Record<string, string> }
  | { kind: "batas"; message: string; retryAfterMinutes: number }
  | { kind: "server"; message: string };

/**
 * Simpan laporan dulu, AI belakangan: tidak ada panggilan AI di sini, sehingga
 * laporan tetap tersimpan walau penyedia AI sedang bermasalah.
 */
export async function submitReport(body: unknown, headers: Headers): Promise<SubmitResult> {
  const limit = await checkRateLimit("laporan", headers);
  if (!limit.allowed) {
    return {
      kind: "batas",
      retryAfterMinutes: limit.retryAfterMinutes,
      message: `Sudah 5 laporan dari jaringan ini dalam satu jam. Coba lagi sekitar ${limit.retryAfterMinutes} menit lagi, atau kirim lewat WhatsApp.`,
    };
  }
  const parsed = reportFormSchema.safeParse(body);
  if (!parsed.success) return { kind: "isian", fields: fieldErrors(parsed.error) };
  if (parsed.data.villageCode && !findVillage(parsed.data.villageCode)) {
    return { kind: "isian", fields: { villageCode: "Desa tidak dikenal. Pilih dari daftar." } };
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
    return {
      kind: "server",
      message: "Laporan belum tersimpan. Coba lagi, atau kirim lewat WhatsApp.",
    };
  }
  return { kind: "ok", id: report.id, code: report.publicCode };
}

/**
 * Isian dari formulir HTML biasa (sebelum JavaScript termuat). Desa yang hanya
 * diketik dicocokkan ke daftar desa; jika tidak cocok, lokasinya ditulis di cerita.
 */
export function formDataToInput(fd: FormData): Record<string, unknown> {
  let villageCode = String(fd.get("villageCode") ?? "") || null;
  let story = String(fd.get("story") ?? "");
  const typed = String(fd.get("desaCari") ?? "").trim();
  if (!villageCode && typed) {
    const villages = listVillages().map((v) => ({
      code: v.code,
      name: v.name,
      districtName: v.districtName,
    }));
    const match = matchLocation(typed, villages);
    if (match.kind === "cocok") villageCode = match.village.code;
    else story = `Lokasi yang diketik: ${typed}\n${story}`.trim();
  }
  return {
    villageCode,
    needs: fd.getAll("needs").map(String),
    vulnerable: fd.getAll("vulnerable").map(String),
    story,
    forSelf: fd.get("forSelf") !== "0",
    phone: String(fd.get("phone") ?? ""),
    consent: fd.get("consent") === "1",
  };
}
