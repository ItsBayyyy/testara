import { GeminiProvider } from "@/lib/ai/providers/gemini";
import { GroqProvider } from "@/lib/ai/providers/groq";
import type { AIProvider } from "@/lib/ai/providers/types";
import type { AiDeps } from "@/lib/ai/run";

// Dependensi AI untuk skrip baris perintah: tanpa database, cache di memori,
// tanpa batas anggaran harian (skrip dijalankan manual oleh tim).

export function scriptProviders(): AIProvider[] {
  const list: AIProvider[] = [];
  if (process.env.GROQ_API_KEY) list.push(new GroqProvider(process.env.GROQ_API_KEY));
  if (process.env.GEMINI_API_KEY) list.push(new GeminiProvider(process.env.GEMINI_API_KEY));
  return list;
}

export function scriptDeps(): AiDeps {
  const cache = new Map<string, unknown>();
  return {
    providers: scriptProviders(),
    cacheGet: async (k) => cache.get(k) ?? null,
    cacheSet: async (k, v) => void cache.set(k, v),
    takeBudget: async () => true,
  };
}

export function requireProviders(): void {
  if (scriptProviders().length === 0) {
    console.error("Tidak ada GROQ_API_KEY atau GEMINI_API_KEY. Isi .env.local lalu jalankan lagi.");
    process.exit(1);
  }
}
