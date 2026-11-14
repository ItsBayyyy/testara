"use client";

import { useState, type FormEvent } from "react";
import { SECTION_LABELS, type BoardItem } from "@/lib/board/items";
import type { BoardContact } from "@/lib/domain/types";

type Answer =
  | { kind: "jawaban"; answer: string; items: BoardItem[] }
  | { kind: "belum_ada"; items: BoardItem[]; contacts: BoardContact[] }
  | { kind: "gagal"; message: string };

const SIGNAL = "Pertanyaan belum terkirim karena sinyal. Baca papan info di bawah, atau coba lagi.";

function ItemList({ items, label }: { items: BoardItem[]; label: string }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-2">
      <p className="text-base text-ink-2">{label}</p>
      <ul className="mt-1 flex flex-col gap-1">
        {items.map((i) => (
          <li key={i.id}>
            <a href={`#butir-${i.id}`} className="underline">
              {SECTION_LABELS[i.section]}: {i.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AskBox({
  villageCode,
  poskoPhone,
  poskoIsExample,
}: {
  villageCode: string;
  poskoPhone: string;
  poskoIsExample: boolean;
}) {
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<Answer | null>(null);

  async function ask(e: FormEvent) {
    e.preventDefault();
    if (question.trim().length < 3) {
      setAnswer({ kind: "gagal", message: "Tulis pertanyaan minimal 3 huruf." });
      return;
    }
    setBusy(true);
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ villageCode, question }),
    }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as (Answer & { message?: string }) | null;
    setBusy(false);
    if (!res || !body) setAnswer({ kind: "gagal", message: SIGNAL });
    else if (!res.ok) setAnswer({ kind: "gagal", message: body.message ?? SIGNAL });
    else setAnswer(body);
  }

  return (
    <section
      aria-labelledby="judul-tanya"
      className="panel rounded-[var(--radius-field)] px-4 py-4"
    >
      <h2 id="judul-tanya" className="text-xl">
        Tanya papan info
      </h2>
      <p className="hint">Jawaban hanya dari informasi resmi di papan ini.</p>
      <form onSubmit={ask} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="pertanyaan" className="sr-only">
          Pertanyaan
        </label>
        <input
          id="pertanyaan"
          className="field"
          placeholder="Contoh: Di mana ambil air bersih?"
          value={question}
          maxLength={300}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button type="submit" className="btn btn-primary shrink-0" disabled={busy}>
          {busy ? "Mencari..." : "Tanya"}
        </button>
      </form>

      <div aria-live="polite" className="mt-3">
        {answer?.kind === "jawaban" && (
          <div>
            <p className="text-lg">{answer.answer}</p>
            <ItemList items={answer.items} label="Dari papan info:" />
          </div>
        )}
        {answer?.kind === "belum_ada" && (
          <div>
            <p className="font-bold">
              Belum ada informasi resmi untuk itu. Hubungi posko di nomor berikut.
            </p>
            {answer.contacts.length > 0 ? (
              <ul className="mt-1">
                {answer.contacts.map((c) => (
                  <li key={c.id}>
                    {c.name}:{" "}
                    <a className="num font-bold" href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}>
                      {c.phone}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1">
                Posko:{" "}
                <a className="num font-bold" href={`tel:${poskoPhone}`}>
                  {poskoPhone}
                </a>
                {poskoIsExample && " (nomor contoh untuk demo)"}
              </p>
            )}
            <ItemList items={answer.items} label="Mungkin membantu:" />
          </div>
        )}
        {answer?.kind === "gagal" && <p className="error-text">{answer.message}</p>}
      </div>
    </section>
  );
}
