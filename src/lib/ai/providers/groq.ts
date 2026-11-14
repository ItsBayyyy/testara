import "server-only";
import { postJson, ProviderError, type AIProvider, type GenerateRequest } from "./types";

// Groq, model gpt-oss-120b, structured output mode strict.
// Referensi: https://console.groq.com/docs/structured-outputs dan /docs/reasoning

export const GROQ_MODEL = "openai/gpt-oss-120b";
const URL = "https://api.groq.com/openai/v1/chat/completions";

type GroqResponse = { choices?: { message?: { content?: string | null } }[] };

export class GroqProvider implements AIProvider {
  readonly name = "groq" as const;
  readonly model = GROQ_MODEL;

  constructor(private apiKey: string) {}

  async generate(req: GenerateRequest): Promise<string> {
    const data = (await postJson(
      this.name,
      URL,
      { Authorization: `Bearer ${this.apiKey}` },
      {
        model: this.model,
        messages: [
          { role: "system", content: req.system },
          { role: "user", content: req.user },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: req.schemaName, strict: true, schema: req.jsonSchema },
        },
        reasoning_effort: "low",
        include_reasoning: false,
        temperature: 0,
        max_completion_tokens: 4096,
      },
    )) as GroqResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new ProviderError(this.name, 502, true);
    return content;
  }
}
