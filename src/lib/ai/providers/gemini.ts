import "server-only";
import { postJson, ProviderError, type AIProvider, type GenerateRequest } from "./types";

// Google Gemini Flash-Lite sebagai cadangan. Di free tier, prompt dapat dipakai
// Google, jadi pemanggil hanya mengirim teks yang sudah disamarkan.
// Referensi: https://aistudio.google.com/docs/structured-output

export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
};

export class GeminiProvider implements AIProvider {
  readonly name = "gemini" as const;
  readonly model: string;

  constructor(
    private apiKey: string,
    model = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
  ) {
    this.model = model;
  }

  async generate(req: GenerateRequest): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent`;
    const data = (await postJson(
      this.name,
      url,
      { "x-goog-api-key": this.apiKey },
      {
        systemInstruction: { parts: [{ text: req.system }] },
        contents: [{ role: "user", parts: [{ text: req.user }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: req.jsonSchema,
          maxOutputTokens: 4096,
        },
      },
    )) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
    if (!text) throw new ProviderError(this.name, 502, true);
    return text;
  }
}
