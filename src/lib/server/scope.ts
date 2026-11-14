import "server-only";
import { cookies } from "next/headers";
import type { Scope } from "@/lib/db";
import { regencyCode } from "@/lib/wilayah";

export const DEMO_COOKIE = "demo_session_id";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function isDemoSessionId(value: string | undefined | null): value is string {
  return typeof value === "string" && UUID.test(value);
}

/** Lingkup data permintaan ini: sesi demo jika cookie demo ada, selain itu data sungguhan. */
export async function getRequestScope(): Promise<Scope> {
  const jar = await cookies();
  const demo = jar.get(DEMO_COOKIE)?.value;
  return { demoSessionId: isDemoSessionId(demo) ? demo : null, regencyCode: regencyCode() };
}
