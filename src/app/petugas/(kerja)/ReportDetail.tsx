import { HighlightedText } from "@/components/petugas/HighlightedText";
import {
  FIELD_LABELS,
  NEED_LABELS,
  STATUS_LABELS,
  URGENCY_LABELS,
  URGENCY_SOURCE_LABELS,
  VULNERABLE_LABELS,
} from "@/lib/domain/labels";
import { canTransition } from "@/lib/domain/status";
import { URGENCIES, type Report } from "@/lib/domain/types";
import { formatDateTime } from "@/lib/format";
import { findVillage, villageLabel, type Village } from "@/lib/wilayah";
import { retryReportAi, setReportStatus, setReportUrgency, setReportVillage } from "./actions";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-3 border-b border-line py-2 max-sm:grid-cols-1 max-sm:gap-0">
      <dt className="text-ink-2">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

const STATUS_ACTIONS = [
  { status: "dibaca", label: "Tandai dibaca" },
  { status: "resmi", label: "Masuk laporan resmi" },
  { status: "perlu_konfirmasi", label: "Perlu konfirmasi" },
] as const;

export function ReportDetail({ report, villages }: { report: Report; villages: Village[] }) {
  const village = findVillage(report.villageCode);
  const ex = report.extraction;
  const quotes = [
    ...(report.urgencyQuote ? [{ id: "kutipan-urgensi", quote: report.urgencyQuote }] : []),
    ...(ex?.claims ?? []).map((c, i) => ({ id: `kutipan-${i}`, quote: c.quote })),
  ];

  return (
    <article aria-labelledby="judul-laporan" className="flex flex-col gap-5">
      <header>
        <h2 id="judul-laporan" className="text-xl">
          Laporan <span className="code-text">{report.publicCode}</span>
        </h2>
        <p className="num text-ink-2">
          {village ? villageLabel(village) : "Desa belum diketahui"},{" "}
          {formatDateTime(report.sourceMeta?.sentAt ?? report.createdAt)}, dari{" "}
          {report.source === "form" ? "formulir" : "WhatsApp"}
          {report.sourceMeta?.sender && ` (${report.sourceMeta.sender})`}
        </p>
      </header>

      <p className={`px-3 py-2 ${ex ? "panel" : "flag-action panel"}`}>
        {ex
          ? "Dirapikan otomatis. Periksa sebelum ditindaklanjuti."
          : "Belum dirapikan AI. Laporan tampil apa adanya; urgensi dari aturan."}{" "}
        Belum diverifikasi.
      </p>

      {ex?.possiblyIrrelevant && (
        <p className="flag-action panel px-3 py-2">
          Mungkin tidak terkait bencana. Tetap periksa; laporan tidak disembunyikan.
        </p>
      )}

      <dl>
        <Row label="Status">{STATUS_LABELS[report.status]}</Row>
        <Row label="Urgensi">
          <span className={report.urgency === "tinggi" ? "font-bold text-action-ink" : "font-bold"}>
            {URGENCY_LABELS[report.urgency]}
          </span>{" "}
          karena: {report.urgencyReason}
          {report.urgencyQuote && (
            <>
              {" "}
              <a href="#kutipan-urgensi" className="mark-source no-underline">
                &ldquo;{report.urgencyQuote}&rdquo;
              </a>
            </>
          )}{" "}
          <span className="text-ink-2">({URGENCY_SOURCE_LABELS[report.urgencySource]})</span>
        </Row>
        <Row label="Kebutuhan">
          {report.needs.length
            ? report.needs.map((n) => NEED_LABELS[n]).join(", ")
            : "tidak dipilih"}
          {ex && ex.needs.some((n) => !report.needs.includes(n)) && (
            <span className="block text-ink-2">
              Disebut di cerita:{" "}
              {ex.needs
                .filter((n) => !report.needs.includes(n))
                .map((n) => NEED_LABELS[n])
                .join(", ")}
            </span>
          )}
        </Row>
        <Row label="Didahulukan">
          {report.vulnerable.length
            ? report.vulnerable.map((v) => VULNERABLE_LABELS[v]).join(", ")
            : "tidak ada"}
          {ex && ex.vulnerable.some((v) => !report.vulnerable.includes(v)) && (
            <span className="block text-ink-2">
              Disebut di cerita:{" "}
              {ex.vulnerable
                .filter((v) => !report.vulnerable.includes(v))
                .map((v) => VULNERABLE_LABELS[v])
                .join(", ")}
            </span>
          )}
        </Row>
        {ex && <Row label="Ringkasan">{ex.summary}</Row>}
        <Row label="Untuk">{report.forSelf ? "Pelapor sendiri" : "Orang lain"}</Row>
        <Row label="Nomor HP">
          {report.reporterPhone ? (
            <a href={`tel:${report.reporterPhone.replace(/[^\d+]/g, "")}`} className="num">
              {report.reporterPhone}
            </a>
          ) : (
            "tidak diisi"
          )}
        </Row>
      </dl>

      <section aria-labelledby="judul-cerita">
        <h3 id="judul-cerita" className="mb-1 font-bold">
          Cerita
        </h3>
        <div className="panel px-3 py-2">
          {report.storyText ? (
            <HighlightedText text={report.storyText} quotes={quotes} />
          ) : (
            <p className="text-ink-2">Tanpa cerita. Pelapor hanya memilih tombol kebutuhan.</p>
          )}
        </div>
      </section>

      {ex && ex.claims.length > 0 && (
        <section aria-labelledby="judul-angka">
          <h3 id="judul-angka" className="mb-1 font-bold">
            Angka di cerita
          </h3>
          <ul className="panel divide-y divide-line">
            {ex.claims.map((c, i) => (
              <li key={i} className="flex flex-wrap justify-between gap-2 px-3 py-2">
                <span>{FIELD_LABELS[c.field]}</span>
                <a href={`#kutipan-${i}`} className="num font-bold">
                  {c.approximate && typeof c.value === "number" ? "sekitar " : ""}
                  {c.value}
                </a>
              </li>
            ))}
          </ul>
          {ex.droppedClaims.length > 0 && (
            <p className="hint mt-1">
              {ex.droppedClaims.length} angka dibuang karena kutipannya tidak ditemukan di cerita.
            </p>
          )}
        </section>
      )}

      <section aria-labelledby="judul-tindakan" className="flex flex-col gap-3">
        <h3 id="judul-tindakan" className="font-bold">
          Tindakan
        </h3>
        <div className="flex flex-wrap gap-2">
          {STATUS_ACTIONS.filter((a) => canTransition(report.status, a.status)).map((a) => (
            <form key={a.status} action={setReportStatus}>
              <input type="hidden" name="id" value={report.id} />
              <input type="hidden" name="status" value={a.status} />
              <button
                type="submit"
                className={a.status === "dibaca" ? "btn btn-primary" : "btn btn-secondary"}
              >
                {a.label}
              </button>
            </form>
          ))}
        </div>

        <form action={setReportUrgency} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="id" value={report.id} />
          <div>
            <label htmlFor="urgensi" className="label">
              Ubah urgensi
            </label>
            <select id="urgensi" name="urgency" defaultValue={report.urgency} className="field">
              {URGENCIES.map((u) => (
                <option key={u} value={u}>
                  {URGENCY_LABELS[u]}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-quiet">
            Simpan urgensi
          </button>
        </form>

        {!village && (
          <form action={setReportVillage} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="id" value={report.id} />
            <div className="min-w-60 flex-1">
              <label htmlFor="desa-laporan" className="label">
                Tetapkan desa
              </label>
              <select id="desa-laporan" name="villageCode" className="field" defaultValue="">
                <option value="" disabled>
                  Pilih desa
                </option>
                {villages.map((v) => (
                  <option key={v.code} value={v.code}>
                    {v.name}, Kec. {v.districtName}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-quiet">
              Simpan desa
            </button>
          </form>
        )}

        {report.aiState !== "selesai" && (
          <form action={retryReportAi}>
            <input type="hidden" name="id" value={report.id} />
            <button type="submit" className="btn btn-quiet">
              Coba rapikan otomatis lagi
            </button>
          </form>
        )}
      </section>
    </article>
  );
}
