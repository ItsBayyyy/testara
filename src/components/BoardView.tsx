import { AID_KIND_LABELS } from "@/lib/domain/labels";
import type { BoardContent } from "@/lib/domain/types";

function Section({
  id,
  title,
  empty,
  children,
}: {
  id: string;
  title: string;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="border-t border-line pt-4">
      <h2 id={id} className="text-xl">
        {title}
      </h2>
      {empty ? <p className="mt-1 text-ink-2">Belum ada informasi resmi.</p> : children}
    </section>
  );
}

/** Isi papan info desa. Setiap butir punya id agar bisa ditunjuk oleh jawaban tanya. */
export function BoardView({ content }: { content: BoardContent }) {
  return (
    <div className="flex flex-col gap-6">
      <Section id="pengungsian" title="Pengungsian" empty={content.shelters.length === 0}>
        <ul className="mt-2 flex flex-col gap-3">
          {content.shelters.map((s) => (
            <li key={s.id} id={`butir-${s.id}`}>
              <p className="font-semibold">{s.name}</p>
              {s.location && <p>{s.location}</p>}
              {s.note && <p className="text-ink-2">{s.note}</p>}
            </li>
          ))}
        </ul>
      </Section>
      <Section id="titik-bantuan" title="Titik bantuan" empty={content.aidPoints.length === 0}>
        <ul className="mt-2 flex flex-col gap-3">
          {content.aidPoints.map((a) => (
            <li key={a.id} id={`butir-${a.id}`}>
              <p className="font-semibold">
                {AID_KIND_LABELS[a.kind]}: {a.name}
              </p>
              {a.location && <p>{a.location}</p>}
              {a.hours && <p className="num">Buka {a.hours}</p>}
              {a.note && <p className="text-ink-2">{a.note}</p>}
            </li>
          ))}
        </ul>
      </Section>
      <Section
        id="kebutuhan"
        title="Kebutuhan yang diumumkan"
        empty={content.announcedNeeds.length === 0}
      >
        <ul className="mt-2 list-disc pl-5">
          {content.announcedNeeds.map((n) => (
            <li key={n.id} id={`butir-${n.id}`}>
              {n.text}
            </li>
          ))}
        </ul>
      </Section>
      <Section id="kontak" title="Kontak posko" empty={content.contacts.length === 0}>
        <ul className="mt-2 flex flex-col gap-3">
          {content.contacts.map((c) => (
            <li key={c.id} id={`butir-${c.id}`}>
              <p className="font-semibold">{c.name}</p>
              {c.phone && (
                <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="num font-semibold">
                  {c.phone}
                </a>
              )}
              {c.note && <p className="text-ink-2">{c.note}</p>}
            </li>
          ))}
        </ul>
      </Section>
      {content.notes.length > 0 && (
        <Section id="catatan" title="Catatan" empty={false}>
          <ul className="mt-2 list-disc pl-5">
            {content.notes.map((n) => (
              <li key={n.id} id={`butir-${n.id}`}>
                {n.text}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
