"use client";

import { useActionState, useState } from "react";
import { AID_KIND_LABELS } from "@/lib/domain/labels";
import { AID_KINDS, type AidKind, type BoardContent } from "@/lib/domain/types";
import { publishBoard, suggestBoard, type PublishState, type SuggestState } from "../actions";

type Section = keyof BoardContent;

let counter = 0;
const newId = () => `baru${++counter}`;

const BLANK: { [K in Section]: () => BoardContent[K][number] } = {
  shelters: () => ({ id: newId(), name: "", location: "", note: "" }),
  aidPoints: () => ({
    id: newId(),
    kind: "air_bersih",
    name: "",
    location: "",
    hours: "",
    note: "",
  }),
  announcedNeeds: () => ({ id: newId(), text: "" }),
  contacts: () => ({ id: newId(), name: "", phone: "", note: "" }),
  notes: () => ({ id: newId(), text: "" }),
};

function TextField({
  label,
  value,
  onChange,
  wide = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  wide?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-1 ${wide ? "sm:col-span-2" : ""}`}>
      <span className="text-sm font-bold">{label}</span>
      <input
        className="field !min-h-10 !py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function RemoveButton({ what, onClick }: { what: string; onClick: () => void }) {
  return (
    <button type="button" className="btn btn-quiet btn-compact self-end" onClick={onClick}>
      Hapus {what}
    </button>
  );
}

export function BoardEditor({
  villageCode,
  villageName,
  initial,
}: {
  villageCode: string;
  villageName: string;
  initial: BoardContent;
}) {
  const [content, setContent] = useState<BoardContent>(initial);
  const [published, publishAction, publishing] = useActionState<PublishState, FormData>(
    publishBoard,
    {
      ok: false,
      message: null,
      publishedAt: null,
    },
  );
  const [suggested, suggestAction, suggesting] = useActionState<SuggestState, FormData>(
    suggestBoard,
    {
      suggestions: [],
      message: null,
    },
  );

  function updateRow<S extends Section>(
    section: S,
    id: string,
    patch: Partial<BoardContent[S][number]>,
  ) {
    setContent((c) => ({
      ...c,
      [section]: (c[section] as BoardContent[S][number][]).map((r) =>
        r.id === id ? { ...r, ...patch } : r,
      ),
    }));
  }
  const addRow = (section: Section, row?: BoardContent[Section][number]) =>
    setContent((c) => ({ ...c, [section]: [...c[section], row ?? BLANK[section]()] }));
  const removeRow = (section: Section, id: string) =>
    setContent((c) => ({
      ...c,
      [section]: (c[section] as { id: string }[]).filter((r) => r.id !== id),
    }));

  return (
    <div className="flex flex-col gap-10">
      <fieldset className="flex flex-col gap-3">
        <legend className="text-lg font-bold">Pengungsian</legend>
        {content.shelters.map((s) => (
          <div key={s.id} className="grid gap-3 border-l-4 border-line py-1 pl-4 sm:grid-cols-2">
            <TextField
              label="Nama tempat"
              value={s.name}
              onChange={(v) => updateRow("shelters", s.id, { name: v })}
            />
            <TextField
              label="Lokasi"
              value={s.location}
              onChange={(v) => updateRow("shelters", s.id, { location: v })}
            />
            <TextField
              label="Catatan"
              wide
              value={s.note}
              onChange={(v) => updateRow("shelters", s.id, { note: v })}
            />
            <RemoveButton what="pengungsian" onClick={() => removeRow("shelters", s.id)} />
          </div>
        ))}
        <button
          type="button"
          className="btn btn-secondary btn-compact self-start"
          onClick={() => addRow("shelters")}
        >
          Tambah pengungsian
        </button>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-lg font-bold">Titik bantuan</legend>
        {content.aidPoints.map((a) => (
          <div key={a.id} className="grid gap-3 border-l-4 border-line py-1 pl-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-bold">Jenis</span>
              <select
                className="field !min-h-10 !py-2"
                value={a.kind}
                onChange={(e) => updateRow("aidPoints", a.id, { kind: e.target.value as AidKind })}
              >
                {AID_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {AID_KIND_LABELS[k]}
                  </option>
                ))}
              </select>
            </label>
            <TextField
              label="Nama"
              value={a.name}
              onChange={(v) => updateRow("aidPoints", a.id, { name: v })}
            />
            <TextField
              label="Lokasi"
              value={a.location}
              onChange={(v) => updateRow("aidPoints", a.id, { location: v })}
            />
            <TextField
              label="Jam buka"
              value={a.hours}
              onChange={(v) => updateRow("aidPoints", a.id, { hours: v })}
            />
            <TextField
              label="Catatan"
              wide
              value={a.note}
              onChange={(v) => updateRow("aidPoints", a.id, { note: v })}
            />
            <RemoveButton what="titik" onClick={() => removeRow("aidPoints", a.id)} />
          </div>
        ))}
        <button
          type="button"
          className="btn btn-secondary btn-compact self-start"
          onClick={() => addRow("aidPoints")}
        >
          Tambah titik bantuan
        </button>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-lg font-bold">Kebutuhan yang diumumkan</legend>
        {content.announcedNeeds.map((n) => (
          <div key={n.id} className="flex items-end gap-2">
            <div className="flex-1">
              <TextField
                label="Kebutuhan"
                value={n.text}
                onChange={(v) => updateRow("announcedNeeds", n.id, { text: v })}
              />
            </div>
            <RemoveButton what="kebutuhan" onClick={() => removeRow("announcedNeeds", n.id)} />
          </div>
        ))}
        <button
          type="button"
          className="btn btn-secondary btn-compact self-start"
          onClick={() => addRow("announcedNeeds")}
        >
          Tambah kebutuhan
        </button>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-lg font-bold">Kontak posko</legend>
        {content.contacts.map((c) => (
          <div key={c.id} className="grid gap-3 border-l-4 border-line py-1 pl-4 sm:grid-cols-2">
            <TextField
              label="Nama posko/petugas"
              value={c.name}
              onChange={(v) => updateRow("contacts", c.id, { name: v })}
            />
            <TextField
              label="Nomor telepon"
              value={c.phone}
              onChange={(v) => updateRow("contacts", c.id, { phone: v })}
            />
            <TextField
              label="Catatan"
              wide
              value={c.note}
              onChange={(v) => updateRow("contacts", c.id, { note: v })}
            />
            <RemoveButton what="kontak" onClick={() => removeRow("contacts", c.id)} />
          </div>
        ))}
        <button
          type="button"
          className="btn btn-secondary btn-compact self-start"
          onClick={() => addRow("contacts")}
        >
          Tambah kontak
        </button>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-lg font-bold">Catatan</legend>
        {content.notes.map((n) => (
          <div key={n.id} className="flex items-end gap-2">
            <div className="flex-1">
              <TextField
                label="Catatan"
                value={n.text}
                onChange={(v) => updateRow("notes", n.id, { text: v })}
              />
            </div>
            <RemoveButton what="catatan" onClick={() => removeRow("notes", n.id)} />
          </div>
        ))}
        <button
          type="button"
          className="btn btn-secondary btn-compact self-start"
          onClick={() => addRow("notes")}
        >
          Tambah catatan
        </button>
      </fieldset>

      <section aria-labelledby="judul-usulan">
        <h2 id="judul-usulan" className="text-lg">
          Usulan dari laporan resmi
        </h2>
        <p className="hint">Usulan otomatis hanya bahan. Periksa sebelum ditambahkan.</p>
        <form action={suggestAction} className="mt-2">
          <input type="hidden" name="villageCode" value={villageCode} />
          <button
            type="submit"
            className="btn btn-secondary btn-compact"
            aria-busy={suggesting}
            disabled={suggesting}
          >
            {suggesting ? "Menyusun usulan..." : "Usulkan isi dari laporan"}
          </button>
        </form>
        <div aria-live="polite" className="mt-3">
          {suggested.message && <p>{suggested.message}</p>}
          {suggested.suggestions.length > 0 && (
            <ul className="panel divide-y divide-line">
              {suggested.suggestions.map((s, i) => (
                <li key={i} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                  <span>
                    <span className="font-bold">{s.text}</span>{" "}
                    <span className="text-sm text-ink-2">
                      ({s.section === "notes" ? "catatan" : "kebutuhan"}, {s.source})
                    </span>
                  </span>
                  <button
                    type="button"
                    className="btn btn-quiet btn-compact"
                    onClick={() => addRow(s.section, { id: newId(), text: s.text })}
                  >
                    Tambahkan
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <form
        action={publishAction}
        className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-line bg-surface py-3"
      >
        <input type="hidden" name="villageCode" value={villageCode} />
        <input type="hidden" name="content" value={JSON.stringify(content)} />
        <button
          type="submit"
          className="btn btn-primary"
          aria-busy={publishing}
          disabled={publishing}
        >
          {publishing ? "Menerbitkan..." : "Terbitkan papan info"}
        </button>
        <p aria-live="polite" className={published.ok ? "font-bold text-done" : "error-text"}>
          {published.message}
          {published.ok && ` Warga ${villageName} sudah bisa melihatnya.`}
        </p>
      </form>
    </div>
  );
}
