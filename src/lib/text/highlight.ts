import { locateQuote } from "./normalize";

export type Segment = { text: string; markId: string | null };

/**
 * Pecah teks menjadi potongan biasa dan potongan bertanda stabilo untuk setiap
 * kutipan yang ditemukan. Kutipan yang tumpang tindih digabung ke yang pertama.
 */
export function segmentByQuotes(text: string, quotes: { id: string; quote: string }[]): Segment[] {
  const ranges = quotes
    .map((q) => ({ id: q.id, range: locateQuote(text, q.quote) }))
    .filter((r): r is { id: string; range: { start: number; end: number } } => r.range !== null)
    .sort((a, b) => a.range.start - b.range.start);

  const segments: Segment[] = [];
  let cursor = 0;
  for (const { id, range } of ranges) {
    if (range.start < cursor) continue;
    if (range.start > cursor)
      segments.push({ text: text.slice(cursor, range.start), markId: null });
    segments.push({ text: text.slice(range.start, range.end), markId: id });
    cursor = range.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), markId: null });
  return segments;
}
