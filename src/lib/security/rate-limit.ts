import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { getStore } from "@/lib/db";

// Pembatasan laju per IP. IP tidak pernah disimpan mentah: di-hash dengan garam.

export const LIMITS = {
  laporan: 5,
  whatsapp: 10,
  tanya: 20,
} as const;

export type LimitBucket = keyof typeof LIMITS;

// Tanpa IP_HASH_SALT, garam acak per proses tetap mencegah IP tersimpan mentah.
const fallbackSalt = randomBytes(16).toString("hex");

export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "tidak-diketahui";
}

export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT || fallbackSalt;
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export type LimitResult = { allowed: true } | { allowed: false; retryAfterMinutes: number };

export async function checkRateLimit(
  bucket: LimitBucket,
  headers: Headers,
  now = new Date(),
): Promise<LimitResult> {
  const hour = new Date(now);
  hour.setUTCMinutes(0, 0, 0);
  const count = await getStore().hitRateLimit(
    `${bucket}:${hashIp(clientIp(headers))}`,
    hour.toISOString(),
  );
  if (count <= LIMITS[bucket]) return { allowed: true };
  const nextHour = hour.getTime() + 60 * 60 * 1000;
  return {
    allowed: false,
    retryAfterMinutes: Math.max(1, Math.ceil((nextHour - now.getTime()) / 60000)),
  };
}
