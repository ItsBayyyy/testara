"use client";

import { useId, useMemo, useState } from "react";

export type VillageOption = { code: string; label: string; district: string };

function simplify(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b(desa|ds|kelurahan|kel)\b\.?/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Pencarian desa sederhana: ketik, lalu pilih dari tombol hasil.
 * Tombol biasa (bukan combobox) supaya mudah dipakai dengan sentuh, keyboard,
 * dan pembaca layar tanpa library tambahan.
 */
export function VillagePicker({
  villages,
  value,
  onChange,
  error,
}: {
  villages: VillageOption[];
  value: string | null;
  onChange: (code: string | null) => void;
  error?: string;
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const selected = villages.find((v) => v.code === value) ?? null;

  const results = useMemo(() => {
    const q = simplify(query);
    if (q.length < 2) return [];
    return villages
      .filter((v) => simplify(v.label).includes(q) || simplify(v.district).includes(q))
      .sort(
        (a, b) =>
          Number(!simplify(a.label).startsWith(q)) - Number(!simplify(b.label).startsWith(q)),
      )
      .slice(0, 8);
  }, [query, villages]);

  if (selected) {
    return (
      <div>
        <p className="label" id={`${id}-label`}>
          Desa Anda
        </p>
        <div className="panel flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-field)] px-4 py-3">
          <p>
            <span className="font-bold">{selected.label}</span>
            <span className="block text-base text-ink-2">Kecamatan {selected.district}</span>
          </p>
          <button
            type="button"
            className="btn btn-quiet btn-compact"
            onClick={() => {
              onChange(null);
              setQuery("");
            }}
          >
            Ganti desa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={`${id}-input`} className="label">
        Desa Anda
      </label>
      <input
        id={`${id}-input`}
        type="search"
        className="field"
        placeholder="Cari desa..."
        autoComplete="off"
        name="desaCari"
        onChange={(e) => setQuery(e.target.value)}
        aria-describedby={`${id}-hint ${error ? `${id}-error` : ""}`}
        aria-invalid={error ? true : undefined}
      />
      <p id={`${id}-hint`} className="hint mt-1">
        Ketik minimal 2 huruf nama desa atau kecamatan.
      </p>
      {error && (
        <p id={`${id}-error`} className="error-text mt-1">
          {error}
        </p>
      )}
      {query.trim().length >= 2 && (
        <div aria-live="polite">
          {results.length === 0 ? (
            <p className="mt-2 text-ink-2">
              Desa tidak ditemukan. Lanjutkan saja dan tulis lokasinya di cerita.
            </p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2" aria-label="Hasil pencarian desa">
              {results.map((v) => (
                <li key={v.code}>
                  <button
                    type="button"
                    className="choice w-full !min-h-12 !py-2 font-normal"
                    onClick={() => onChange(v.code)}
                  >
                    <span>
                      <span className="font-bold">{v.label}</span>
                      <span className="block text-base text-ink-2">Kecamatan {v.district}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
