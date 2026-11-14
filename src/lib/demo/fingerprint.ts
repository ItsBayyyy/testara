import { createHash } from "node:crypto";

/** Sidik cerita: hasil AI tersimpan hanya dipakai jika ceritanya belum berubah. */
export function storyFingerprint(story: string): string {
  return createHash("sha256").update(story).digest("hex").slice(0, 16);
}
