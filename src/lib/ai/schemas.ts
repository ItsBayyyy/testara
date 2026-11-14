import { z } from "zod";
import { CLAIM_FIELDS, HAZARDS, NEEDS, URGENCIES, VULNERABLE } from "@/lib/domain/types";

// Skema keluaran model. Zod adalah sumber kebenaran; JSON Schema untuk
// structured output penyedia diturunkan dari sini (semua field wajib,
// nilai opsional bertipe null, tanpa properti tambahan: syarat mode strict Groq).

const claimOut = z.strictObject({
  field: z.enum(CLAIM_FIELDS),
  value: z.union([z.number(), z.string()]),
  approximate: z.boolean(),
  quote: z.string(),
});

export const reportExtractionOut = z.strictObject({
  locationText: z.string().nullable(),
  hazard: z.enum(HAZARDS).nullable(),
  claims: z.array(claimOut),
  needs: z.array(z.enum(NEEDS)),
  vulnerable: z.array(z.enum(VULNERABLE)),
  urgency: z.enum(URGENCIES),
  urgencyReason: z.string(),
  urgencyQuote: z.string().nullable(),
  summary: z.string(),
  possiblyIrrelevant: z.boolean(),
});
export type ReportExtractionOut = z.infer<typeof reportExtractionOut>;

export const whatsappExtractionOut = z.strictObject({
  messages: z.array(
    z.strictObject({
      messageId: z.string(),
      relevant: z.boolean(),
      locationText: z.string().nullable(),
      hazard: z.enum(HAZARDS).nullable(),
      claims: z.array(claimOut),
      needs: z.array(z.enum(NEEDS)),
      vulnerable: z.array(z.enum(VULNERABLE)),
      urgency: z.enum(URGENCIES),
      urgencyReason: z.string(),
      urgencyQuote: z.string().nullable(),
      summary: z.string(),
    }),
  ),
});
export type WhatsappExtractionOut = z.infer<typeof whatsappExtractionOut>;

export const askOut = z.strictObject({
  answer: z.string(),
  usedItems: z.array(z.string()),
  found: z.boolean(),
});
export type AskOut = z.infer<typeof askOut>;

export const villagePickOut = z.strictObject({ code: z.string().nullable() });

export const boardSuggestionOut = z.strictObject({
  announcedNeeds: z.array(z.strictObject({ text: z.string(), quote: z.string() })),
  notes: z.array(z.strictObject({ text: z.string(), quote: z.string() })),
});
export type BoardSuggestionOut = z.infer<typeof boardSuggestionOut>;

export type JsonSchema = Record<string, unknown>;

export function toProviderSchema(schema: z.ZodType): JsonSchema {
  const { $schema: _ignored, ...rest } = z.toJSONSchema(schema, {
    target: "draft-7",
  }) as JsonSchema;
  return rest;
}
