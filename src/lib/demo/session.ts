import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { DEMO_STAFF_COOKIE } from "@/lib/auth/staff";
import { DEMO_COOKIE, isDemoSessionId } from "@/lib/server/scope";
import { regencyCode } from "@/lib/wilayah";
import { seedDemoData } from "./seed";

const DAY_SECONDS = 24 * 60 * 60;

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: DAY_SECONDS,
};

/** Pastikan ada sesi demo; sesi baru langsung diisi data contoh. */
export async function ensureDemoSession(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(DEMO_COOKIE)?.value;
  if (isDemoSessionId(existing)) return existing;
  const id = randomUUID();
  await seedDemoData({ demoSessionId: id, regencyCode: regencyCode() }, new Date());
  jar.set(DEMO_COOKIE, id, cookieOptions);
  return id;
}

export async function enterDemoAsStaff(): Promise<void> {
  await ensureDemoSession();
  (await cookies()).set(DEMO_STAFF_COOKIE, "1", cookieOptions);
}

export async function leaveDemo(): Promise<void> {
  const jar = await cookies();
  jar.delete(DEMO_COOKIE);
  jar.delete(DEMO_STAFF_COOKIE);
}
