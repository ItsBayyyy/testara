import { createHash } from "node:crypto";
import type { z } from "zod";
import type { AIProvider } from "./providers/types";
import { PROMPT_VERSION } from "./prompts/version";
import { toProviderSchema } from "./schemas";

// Orkestrasi panggilan AI: cache, anggaran harian, fallback penyedia, validasi Zod
// dengan satu kali ulang. Dependensi disuntikkan supaya bisa diuji tanpa jaringan.

export type AiDeps = {
  providers: AIProvider[];
  cacheGet(key: string): Promise<unknown | null>;
  cacheSet(key: string, value: unknown): Promise<void>;
  /** Menambah pemakaian hari ini; false jika anggaran sudah habis. */
  takeBudget(): Promise<boolean>;
  /** Hanya metadata: tugas, penyedia, durasi, hasil. Tidak pernah isi teks. */
  log?(entry: { task: string; provider: string; ms: number; outcome: string }): void;
};

export type AiTask<T> = {
  task: string;
  system: string;
  user: string;
  schema: z.ZodType<T>;
};

export type AiResult<T> = { data: T; provider: string; model: string; cached: boolean };

export type AiFailure = { reason: "tidak_dikonfigurasi" | "anggaran_habis" | "semua_gagal" };

export function cacheKey(task: string, user: string, model: string): string {
  return createHash("sha256").update(`${task}\n${PROMPT_VERSION}\n${model}\n${user}`).digest("hex");
}

function parseJson(text: string): unknown {
  // Beberapa model membungkus JSON dengan ```json ... ```.
  const trimmed = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  return JSON.parse(trimmed);
}

export async function runAi<T>(task: AiTask<T>, deps: AiDeps): Promise<AiResult<T> | AiFailure> {
  if (deps.providers.length === 0) return { reason: "tidak_dikonfigurasi" };

  for (const p of deps.providers) {
    const hit = await deps.cacheGet(cacheKey(task.task, task.user, p.model));
    const parsed = hit === null ? null : task.schema.safeParse(hit);
    if (parsed?.success)
      return { data: parsed.data, provider: p.name, model: p.model, cached: true };
  }

  const jsonSchema = toProviderSchema(task.schema);
  for (const provider of deps.providers) {
    let user = task.user;
    for (let attempt = 0; attempt < 2; attempt++) {
      if (!(await deps.takeBudget())) return { reason: "anggaran_habis" };
      const started = Date.now();
      let raw: string;
      try {
        raw = await provider.generate({
          system: task.system,
          user,
          schemaName: task.task,
          jsonSchema,
        });
      } catch {
        deps.log?.({
          task: task.task,
          provider: provider.name,
          ms: Date.now() - started,
          outcome: "error",
        });
        break; // pindah ke penyedia berikutnya
      }
      let candidate: unknown;
      let problem: string;
      try {
        candidate = parseJson(raw);
        const parsed = task.schema.safeParse(candidate);
        if (parsed.success) {
          deps.log?.({
            task: task.task,
            provider: provider.name,
            ms: Date.now() - started,
            outcome: "ok",
          });
          await deps.cacheSet(cacheKey(task.task, task.user, provider.model), parsed.data);
          return {
            data: parsed.data,
            provider: provider.name,
            model: provider.model,
            cached: false,
          };
        }
        problem = parsed.error.issues
          .slice(0, 5)
          .map((i) => `${i.path.join(".") || "(akar)"}: ${i.message}`)
          .join("; ");
      } catch {
        problem = "keluaran bukan JSON yang valid";
      }
      deps.log?.({
        task: task.task,
        provider: provider.name,
        ms: Date.now() - started,
        outcome: "invalid",
      });
      // Ulangi sekali dengan pesan error, sesuai brief 4D.
      user = `${task.user}\n\nKeluaran sebelumnya tidak sesuai skema (${problem}). Kirim ulang JSON yang sesuai skema.`;
    }
  }
  return { reason: "semua_gagal" };
}

export function isAiFailure<T>(r: AiResult<T> | AiFailure): r is AiFailure {
  return "reason" in r;
}
