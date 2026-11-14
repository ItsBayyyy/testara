import "server-only";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Scope } from "@/lib/db";
import type { Staff } from "@/lib/domain/types";
import { DEMO_COOKIE, isDemoSessionId } from "@/lib/server/scope";
import { regencyCode } from "@/lib/wilayah";
import { createAuthClient } from "./supabase-server";

export const DEMO_STAFF_COOKIE = "demo_petugas";

async function realStaff(): Promise<Staff | null> {
  const auth = await createAuthClient();
  if (!auth) return null;
  const { data } = await auth.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  const db = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: row } = await db
    .from("staff")
    .select("name, regency_code")
    .eq("user_id", userId)
    .maybeSingle();
  // Akun Auth tanpa baris staff di kabupaten ini bukan petugas.
  if (!row || row.regency_code !== regencyCode()) return null;
  return { id: userId, name: String(row.name), demo: false, demoSessionId: null };
}

/**
 * Petugas yang sedang masuk. Petugas demo hanya ada di dalam sesi demo dan
 * hanya bisa melihat data sesi itu; petugas sungguhan masuk lewat Supabase Auth.
 */
export async function getStaff(): Promise<Staff | null> {
  const jar = await cookies();
  const demo = jar.get(DEMO_COOKIE)?.value;
  if (isDemoSessionId(demo) && jar.get(DEMO_STAFF_COOKIE)?.value === "1") {
    return { id: "demo", name: "Petugas demo", demo: true, demoSessionId: demo };
  }
  return realStaff();
}

export async function requireStaff(): Promise<Staff> {
  const staff = await getStaff();
  if (!staff) redirect("/petugas/masuk");
  return staff;
}

/** Lingkup data petugas: tidak pernah dari cookie demo jika petugas sungguhan. */
export function staffScope(staff: Staff): Scope {
  return { demoSessionId: staff.demo ? staff.demoSessionId : null, regencyCode: regencyCode() };
}
