import "server-only";
import { dailyAiBudget } from "@/lib/config";
import { getStore } from "@/lib/db";
import { wibDay } from "@/lib/format";
import { GeminiProvider } from "./providers/gemini";
import { GroqProvider } from "./providers/groq";
import type { AIProvider } from "./providers/types";
import { runAi, type AiDeps, type AiFailure, type AiResult, type AiTask } from "./run";

export { isAiFailure } from "./run";

export function configuredProviders(): AIProvider[] {
  const list: AIProvider[] = [];
  if (process.env.GROQ_API_KEY) list.push(new GroqProvider(process.env.GROQ_API_KEY));
  if (process.env.GEMINI_API_KEY) list.push(new GeminiProvider(process.env.GEMINI_API_KEY));
  return list;
}

export async function budgetLeft(now = new Date()): Promise<boolean> {
  return (await getStore().getUsage(wibDay(now))) < dailyAiBudget();
}

function serverDeps(): AiDeps {
  const store = getStore();
  return {
    providers: configuredProviders(),
    cacheGet: (k) => store.cacheGet(k),
    cacheSet: (k, v) => store.cacheSet(k, v),
    takeBudget: async () => (await store.incrementUsage(wibDay(new Date()))) <= dailyAiBudget(),
    log: (e) => console.info(`[ai] ${e.task} ${e.provider} ${e.outcome} ${e.ms}ms`),
  };
}

export function callAi<T>(task: AiTask<T>): Promise<AiResult<T> | AiFailure> {
  return runAi(task, serverDeps());
}
