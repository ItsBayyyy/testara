import { segmentByQuotes } from "@/lib/text/highlight";

/** Teks sumber dengan kutipan bertanda stabilo; setiap tanda punya id untuk dituju. */
export function HighlightedText({
  text,
  quotes,
}: {
  text: string;
  quotes: { id: string; quote: string }[];
}) {
  return (
    <p className="whitespace-pre-wrap break-words">
      {segmentByQuotes(text, quotes).map((s, i) =>
        s.markId ? (
          <mark key={i} id={s.markId} className="mark-source">
            {s.text}
          </mark>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </p>
  );
}
