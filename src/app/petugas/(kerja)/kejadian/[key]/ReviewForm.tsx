"use client";

import { useActionState } from "react";
import { EvidenceJump } from "@/components/petugas/EvidenceJump";
import { saveIncidentReview, type ReviewState } from "../actions";

export type ReviewRow = {
  field: string;
  label: string;
  differs: boolean;
  chosenIndex: number | null;
  values: {
    display: string;
    evidenceCount: number;
    firstEvidenceId: string;
  }[];
};

export function ReviewForm({ incidentKey, rows }: { incidentKey: string; rows: ReviewRow[] }) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(saveIncidentReview, {
    message: null,
    ok: false,
  });

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="key" value={incidentKey} />
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">Angka dampak beserta jumlah pelapor</caption>
        <thead>
          <tr className="border-b border-line-strong">
            <th scope="col" className="py-2 pr-3">
              Data
            </th>
            <th scope="col" className="py-2">
              Nilai dari pesan
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.field}
              className={`border-b border-line align-top ${row.differs ? "bg-action-wash" : ""}`}
            >
              <th
                scope="row"
                className={`py-2 pr-3 font-normal ${row.differs ? "flag-action pl-2" : ""}`}
              >
                {row.label}
                {row.differs && (
                  <span className="block text-[0.875rem] font-semibold text-action-ink">
                    Angka berbeda
                  </span>
                )}
              </th>
              <td className="py-2">
                {row.values.length === 0 ? (
                  <span className="text-ink-2">tidak disebut</span>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {row.values.map((v, i) => (
                      <li key={i} className="flex flex-wrap items-center gap-x-3">
                        {row.differs && (
                          <input
                            type="radio"
                            className="check"
                            name={`pilih_${row.field}`}
                            value={i}
                            defaultChecked={row.chosenIndex === i}
                            aria-label={`Pilih ${v.display} untuk ${row.label}`}
                            required
                          />
                        )}
                        <EvidenceJump targetId={v.firstEvidenceId}>{v.display}</EvidenceJump>
                        <span className="text-[0.875rem] text-ink-2">
                          {v.evidenceCount} pelapor
                        </span>
                        {row.differs && row.chosenIndex === i && (
                          <span className="text-[0.875rem] font-semibold">(dipilih)</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Menyimpan..." : "Simpan sebagai sudah diperiksa"}
        </button>
        <p aria-live="polite" className={state.ok ? "font-semibold text-done" : "error-text"}>
          {state.message}
        </p>
      </div>
    </form>
  );
}
