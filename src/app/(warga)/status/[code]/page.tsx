import type { Metadata } from "next";
import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";
import { Ticket } from "@/components/Ticket";
import { Timeline } from "@/components/Timeline";
import { getStore } from "@/lib/db";
import { normalizePublicCode } from "@/lib/domain/code";
import { NEED_LABELS } from "@/lib/domain/labels";
import { buildTimeline } from "@/lib/domain/status";
import { formatDateTime } from "@/lib/format";
import { findVillage, villageLabel, villageSlug } from "@/lib/wilayah";
import { AutoRefresh } from "./AutoRefresh";

export const metadata: Metadata = { title: "Status laporan", robots: { index: false } };

export default async function StatusPage({ params, searchParams }: PageProps<"/status/[code]">) {
  const { code: rawCode } = await params;
  const { baru } = await searchParams;
  const code = normalizePublicCode(decodeURIComponent(rawCode));
  const store = getStore();
  const report = code ? await store.getReportByCode(code) : null;

  if (!report) {
    return (
      <div className="sheet flex flex-col gap-4">
        <h1 className="text-xl">Kode laporan tidak ditemukan</h1>
        <p>
          Periksa lagi kodenya. Laporan juga dihapus otomatis setelah 30 hari, jadi kode lama tidak
          bisa dibuka.
        </p>
        <Link href="/status" className="btn btn-primary self-start">
          Masukkan kode lain
        </Link>
      </div>
    );
  }

  // Hanya kolom aman yang ditampilkan: tanpa isi cerita dan tanpa nomor HP.
  const events = await store.listEvents(report.id);
  const steps = buildTimeline(events);
  const village = findVillage(report.villageCode);
  const isNew = baru === "1";
  const lastUpdate = events.at(-1)?.createdAt ?? report.createdAt;

  return (
    <div className="flex flex-col gap-8">
      <AutoRefresh />
      <div>
        <h1 className="text-xl">{isNew ? "Laporan Anda sudah kami terima." : "Status laporan"}</h1>
        <p className="mt-2">
          {isNew
            ? "Simpan kode di karcis ini untuk melihat perkembangannya."
            : "Halaman ini diperbarui sendiri setiap 30 detik."}
        </p>
      </div>

      <Ticket
        code={report.publicCode}
        caption={
          <>
            Karcis laporan
            {village ? `, ${villageLabel(village)}` : ""}. Diterima{" "}
            <span className="num">{formatDateTime(report.createdAt)}</span>
          </>
        }
      >
        <div className="mt-4 flex flex-wrap items-start gap-x-4 gap-y-2">
          <CopyButton text={report.publicCode} label="Salin kode" doneLabel="Kode disalin." />
          <Link href={`/status/${report.publicCode}`} className="btn btn-quiet">
            Tautan halaman status
          </Link>
        </div>
      </Ticket>

      <section aria-labelledby="perkembangan" className="sheet flex flex-col gap-4">
        <h2 id="perkembangan" className="text-lg">
          Perkembangan
        </h2>
        <Timeline steps={steps} />
        <p className="border-t border-line pt-4 font-bold">
          Status ini menunjukkan laporan Anda sudah diproses petugas, bukan jaminan waktu kedatangan
          bantuan.
        </p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-ink-2">Kebutuhan</dt>
          <dd>
            {report.needs.length
              ? report.needs.map((n) => NEED_LABELS[n]).join(", ")
              : "tidak disebut"}
          </dd>
          <dt className="text-ink-2">Diperbarui</dt>
          <dd className="num">{formatDateTime(lastUpdate)}</dd>
        </dl>
      </section>

      {village && (
        <Link href={`/info/${villageSlug(village.code)}`} className="btn btn-primary w-full">
          Lihat papan info {villageLabel(village)}
        </Link>
      )}
    </div>
  );
}
