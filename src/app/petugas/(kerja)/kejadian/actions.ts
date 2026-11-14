"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, staffScope } from "@/lib/auth/staff";
import { getStore } from "@/lib/db";
import { CLAIM_FIELDS, type ClaimField } from "@/lib/domain/types";
import { resolveChoices } from "@/lib/extract/review";
import { loadIncidents } from "@/lib/incidents";

export type ReviewState = { message: string | null; ok: boolean };

export async function saveIncidentReview(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const staff = await requireStaff();
  const scope = staffScope(staff);
  const key = String(formData.get("key"));
  const group = (await loadIncidents(scope)).find((g) => g.key === key);
  if (!group) return { ok: false, message: "Kejadian tidak ditemukan. Muat ulang halaman." };

  const picks: Partial<Record<ClaimField, number>> = {};
  for (const field of CLAIM_FIELDS) {
    const raw = formData.get(`pilih_${field}`);
    if (raw !== null) picks[field] = Number(raw);
  }
  const { chosen, missing } = resolveChoices(group, picks);
  if (missing.length > 0) {
    return { ok: false, message: `Pilih dulu angka untuk ${missing.length} baris yang berbeda.` };
  }
  await getStore().saveIncidentReview(
    {
      demoSessionId: scope.demoSessionId,
      villageCode: group.villageCode,
      hazard: group.hazard,
      chosen,
      reviewedBy: staff.name,
      reviewedAt: new Date().toISOString(),
    },
    scope,
  );
  revalidatePath("/petugas/kejadian", "layout");
  return { ok: true, message: "Angka disimpan sebagai sudah diperiksa." };
}
