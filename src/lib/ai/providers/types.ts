import type { JsonSchema } from "../schemas";

export type GenerateRequest = {
  system: string;
  user: string;
  schemaName: string;
  jsonSchema: JsonSchema;
};

export interface AIProvider {
  readonly name: "groq" | "gemini";
  readonly model: string;
  /** Mengembalikan teks JSON mentah dari model. */
  generate(req: GenerateRequest): Promise<string>;
}

/**
 * `retryable` true untuk 429, 5xx, dan timeout: pindah ke penyedia berikutnya.
 * Status lain (mis. 400 skema) tetap dicoba di penyedia berikutnya, tapi dicatat beda.
 */
export class ProviderError extends Error {
  constructor(
    readonly provider: string,
    readonly status: number | "timeout" | "jaringan",
    readonly retryable: boolean,
  ) {
    super(`${provider} gagal (${status})`);
    this.name = "ProviderError";
  }
}

export const CALL_TIMEOUT_MS = 25_000;

export async function postJson(
  provider: string,
  url: string,
  headers: Record<string, string>,
  body: unknown,
): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
    });
  } catch (err) {
    const timeout = err instanceof DOMException && err.name === "TimeoutError";
    throw new ProviderError(provider, timeout ? "timeout" : "jaringan", true);
  }
  if (!res.ok) {
    throw new ProviderError(provider, res.status, res.status === 429 || res.status >= 500);
  }
  return res.json();
}
