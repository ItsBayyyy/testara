import type { AidKind, BoardContent } from "@/lib/domain/types";
import { AID_KIND_LABELS } from "@/lib/domain/labels";

// Papan info diratakan menjadi butir ber-ID. AI hanya boleh merujuk ID ini,
// dan penjaga jawaban memeriksa jawaban terhadap teks butir yang dirujuk.

export type BoardSection = "pengungsian" | "titik_bantuan" | "kebutuhan" | "kontak" | "catatan";

export type BoardItem = {
  id: string;
  section: BoardSection;
  title: string;
  text: string;
  kind?: AidKind;
};

export const SECTION_LABELS: Record<BoardSection, string> = {
  pengungsian: "Pengungsian",
  titik_bantuan: "Titik bantuan",
  kebutuhan: "Kebutuhan diumumkan",
  kontak: "Kontak posko",
  catatan: "Catatan",
};

const join = (...parts: string[]) =>
  parts
    .map((p) => p.trim())
    .filter(Boolean)
    .join(". ");

export function boardItems(content: BoardContent): BoardItem[] {
  return [
    ...content.shelters.map((s) => ({
      id: s.id,
      section: "pengungsian" as const,
      title: s.name,
      text: join(s.name, s.location, s.note),
    })),
    ...content.aidPoints.map((a) => ({
      id: a.id,
      section: "titik_bantuan" as const,
      kind: a.kind,
      title: `${AID_KIND_LABELS[a.kind]}: ${a.name}`,
      text: join(AID_KIND_LABELS[a.kind], a.name, a.location, a.hours, a.note),
    })),
    ...content.announcedNeeds.map((n) => ({
      id: n.id,
      section: "kebutuhan" as const,
      title: n.text,
      text: n.text,
    })),
    ...content.contacts.map((c) => ({
      id: c.id,
      section: "kontak" as const,
      title: c.name,
      text: join(c.name, c.phone, c.note),
    })),
    ...content.notes.map((n) => ({
      id: n.id,
      section: "catatan" as const,
      title: n.text,
      text: n.text,
    })),
  ];
}

export function isBoardEmpty(content: BoardContent): boolean {
  return boardItems(content).length === 0;
}

export function emptyBoard(): BoardContent {
  return { shelters: [], aidPoints: [], announcedNeeds: [], contacts: [], notes: [] };
}
