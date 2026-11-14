import "server-only";
import { callAi, isAiFailure } from "@/lib/ai";
import { askSystem, askUser } from "@/lib/ai/prompts/ask";
import { askOut } from "@/lib/ai/schemas";
import { publicConfig } from "@/lib/config";
import { getStore, type Scope } from "@/lib/db";
import type { BoardContact } from "@/lib/domain/types";
import { findVillage, villageLabel } from "@/lib/wilayah";
import { findRelevantItems, guardAnswer } from "./guard";
import { boardItems, type BoardItem } from "./items";

export type AskResult =
  | { kind: "jawaban"; answer: string; items: BoardItem[] }
  | { kind: "belum_ada"; items: BoardItem[]; contacts: BoardContact[]; aiUsed: boolean };

/**
 * Tanya papan info (CLAUDE.md 4C). AI hanya melihat papan desa ini dan desa lain
 * di kecamatan yang sama. Jawaban yang gagal penjaga diganti "belum ada informasi
 * resmi" beserta butir yang paling relevan.
 */
export async function answerQuestion(
  question: string,
  villageCode: string,
  scope: Scope,
  // Bisa diganti di test untuk mensimulasikan jawaban model.
  ai: typeof callAi = callAi,
): Promise<AskResult> {
  const village = findVillage(villageCode);
  const boards = (await getStore().listLatestBoards(scope)).filter((b) => {
    const v = findVillage(b.villageCode);
    return (
      b.villageCode === villageCode || (v && village && v.districtCode === village.districtCode)
    );
  });
  const own = boards.find((b) => b.villageCode === villageCode);
  const contacts = own?.content.contacts ?? [];

  // ID butir desa lain diberi awalan kode desa supaya tidak bentrok.
  const tagged = boards.map((b) => {
    const v = findVillage(b.villageCode);
    const prefix = b.villageCode === villageCode ? "" : `${b.villageCode.replace(/\./g, "")}-`;
    return {
      village: v ? villageLabel(v) : b.villageCode,
      items: boardItems(b.content).map((i) => ({
        ...i,
        id: `${prefix}${i.id}`,
        text: prefix && v ? `${i.text}. (${villageLabel(v)})` : i.text,
      })),
    };
  });
  const allItems = tagged.flatMap((t) => t.items);
  if (allItems.length === 0) return { kind: "belum_ada", items: [], contacts, aiUsed: false };

  const emergency = publicConfig().emergencyNumber;
  const result = await ai({
    task: "tanya",
    system: askSystem(emergency),
    user: askUser(
      question,
      tagged.map((t) => ({
        village: t.village,
        items: t.items.map(({ id, section, text }) => ({ id, section, text })),
      })),
    ),
    schema: askOut,
  });

  if (!isAiFailure(result)) {
    const guard = guardAnswer(result.data, allItems, [emergency]);
    if (guard.ok) return { kind: "jawaban", answer: result.data.answer.trim(), items: guard.items };
  }
  return {
    kind: "belum_ada",
    items: findRelevantItems(question, allItems),
    contacts,
    aiUsed: !isAiFailure(result),
  };
}
