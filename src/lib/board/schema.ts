import { z } from "zod";
import { AID_KINDS, type BoardContent } from "@/lib/domain/types";

// Validasi isi papan info saat diterbitkan. Baris kosong dibuang, ID dirapikan.

const text = (max: number) => z.string().trim().max(max);
const id = z.string().trim().max(40);

export const boardContentSchema = z.object({
  shelters: z
    .array(z.object({ id, name: text(120), location: text(200), note: text(300) }))
    .max(30),
  aidPoints: z
    .array(
      z.object({
        id,
        kind: z.enum(AID_KINDS),
        name: text(120),
        location: text(200),
        hours: text(80),
        note: text(300),
      }),
    )
    .max(30),
  announcedNeeds: z.array(z.object({ id, text: text(200) })).max(30),
  contacts: z.array(z.object({ id, name: text(120), phone: text(30), note: text(200) })).max(10),
  notes: z.array(z.object({ id, text: text(400) })).max(20),
});

/** Buang baris kosong dan beri ID unik per bagian (p1, b1, k1, c1, n1). */
export function cleanBoard(content: BoardContent): BoardContent {
  const reId = <T extends { id: string }>(rows: T[], prefix: string) =>
    rows.map((r, i) => ({ ...r, id: `${prefix}${i + 1}` }));
  return {
    shelters: reId(
      content.shelters.filter((s) => s.name),
      "p",
    ),
    aidPoints: reId(
      content.aidPoints.filter((a) => a.name || a.location),
      "b",
    ),
    announcedNeeds: reId(
      content.announcedNeeds.filter((n) => n.text),
      "k",
    ),
    contacts: reId(
      content.contacts.filter((c) => c.name || c.phone),
      "c",
    ),
    notes: reId(
      content.notes.filter((n) => n.text),
      "n",
    ),
  };
}
