"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { callAi, isAiFailure } from "@/lib/ai";
import { BOARD_SYSTEM, boardUser } from "@/lib/ai/prompts/board";
import { boardSuggestionOut } from "@/lib/ai/schemas";
import { requireStaff, staffScope } from "@/lib/auth/staff";
import { boardContentSchema, cleanBoard } from "@/lib/board/schema";
import { suggestFromNeeds, verifySuggestions, type Suggestion } from "@/lib/board/suggest";
import { getStore } from "@/lib/db";
import { maskPhoneNumbers } from "@/lib/privacy/mask";
import { findVillage, villageSlug } from "@/lib/wilayah";

export type PublishState = { ok: boolean; message: string | null; publishedAt: string | null };

export async function publishBoard(_prev: PublishState, formData: FormData): Promise<PublishState> {
  const staff = await requireStaff();
  const scope = staffScope(staff);
  const village = findVillage(String(formData.get("villageCode")));
  if (!village) return { ok: false, message: "Desa tidak dikenal.", publishedAt: null };

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("content")));
  } catch {
    return {
      ok: false,
      message: "Isi papan tidak terbaca. Muat ulang halaman.",
      publishedAt: null,
    };
  }
  const parsed = boardContentSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Ada isian yang terlalu panjang. Persingkat lalu terbitkan lagi.",
      publishedAt: null,
    };
  }

  const publishedAt = new Date().toISOString();
  await getStore().publishBoard(
    {
      id: randomUUID(),
      demoSessionId: scope.demoSessionId,
      villageCode: village.code,
      content: cleanBoard(parsed.data),
      publishedAt,
      publishedBy: staff.name,
    },
    scope,
  );
  revalidatePath(`/info/${villageSlug(village.code)}`);
  revalidatePath("/info");
  revalidatePath("/petugas/papan", "layout");
  return { ok: true, message: "Papan info diterbitkan.", publishedAt };
}

export type SuggestState = { suggestions: Suggestion[]; message: string | null };

/** Usulan isi dari laporan desa ini yang sudah masuk laporan resmi. */
export async function suggestBoard(_prev: SuggestState, formData: FormData): Promise<SuggestState> {
  const staff = await requireStaff();
  const scope = staffScope(staff);
  const villageCode = String(formData.get("villageCode"));
  const reports = (await getStore().listReports(scope, { villageCode, status: "resmi" })).slice(
    0,
    15,
  );
  if (reports.length === 0) {
    return {
      suggestions: [],
      message:
        "Belum ada laporan resmi dari desa ini. Tandai laporan sebagai resmi di antrean dulu.",
    };
  }

  const sources = reports.map((r) => maskPhoneNumbers(r.storyText)).filter((t) => t.trim() !== "");
  const fromNeeds = suggestFromNeeds(reports);
  if (sources.length === 0) return { suggestions: fromNeeds, message: null };

  const ai = await callAi({
    task: "papan",
    system: BOARD_SYSTEM,
    user: boardUser(sources.map((text, i) => ({ id: `l${i + 1}`, text }))),
    schema: boardSuggestionOut,
  });
  if (isAiFailure(ai)) {
    return {
      suggestions: fromNeeds,
      message: "Usulan otomatis tidak tersedia. Ini kebutuhan yang paling sering dipilih pelapor.",
    };
  }
  return { suggestions: [...fromNeeds, ...verifySuggestions(ai.data, sources)], message: null };
}
