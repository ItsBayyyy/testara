"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_STAFF_COOKIE } from "@/lib/auth/staff";
import { createAuthClient } from "@/lib/auth/supabase-server";

export type LoginState = { error: string | null };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Isi email dan kata sandi." };
  const auth = await createAuthClient();
  if (!auth) return { error: "Masuk petugas belum dikonfigurasi di server ini. Pakai mode demo." };
  const { error } = await auth.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email atau kata sandi salah. Akun petugas dibuat oleh admin." };
  redirect("/petugas");
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  if (jar.get(DEMO_STAFF_COOKIE)) {
    jar.delete(DEMO_STAFF_COOKIE);
    redirect("/");
  }
  const auth = await createAuthClient();
  await auth?.auth.signOut();
  redirect("/petugas/masuk");
}
