import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStaff, staffScope } from "@/lib/auth/staff";
import { getStore } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { findVillage, listVillages, villageLabel, villageSlug } from "@/lib/wilayah";

export const metadata: Metadata = { title: "Papan info", robots: { index: false } };

async function openEditor(formData: FormData) {
  "use server";
  const village = findVillage(String(formData.get("villageCode")));
  if (village) redirect(`/petugas/papan/${villageSlug(village.code)}`);
}

export default async function BoardsPage() {
  const scope = staffScope(await requireStaff());
  const store = getStore();
  const [boards, reports] = await Promise.all([
    store.listLatestBoards(scope),
    store.listReports(scope),
  ]);
  const reported = new Set(
    reports.map((r) => r.villageCode).filter((c): c is string => c !== null),
  );
  const withoutBoard = [...reported].filter((c) => !boards.some((b) => b.villageCode === c));

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-xl">Papan info</h1>
      <p className="mt-1 text-ink-2">
        Isi papan info per desa, lalu terbitkan. Warga dan fitur tanya papan info hanya memakai isi
        yang sudah diterbitkan.
      </p>

      <form action={openEditor} className="mt-5 flex flex-wrap items-end gap-2">
        <div className="min-w-64 flex-1">
          <label htmlFor="desa-papan" className="label">
            Sunting papan desa
          </label>
          <select id="desa-papan" name="villageCode" className="field" defaultValue="" required>
            <option value="" disabled>
              Pilih desa
            </option>
            {listVillages().map((v) => (
              <option key={v.code} value={v.code}>
                {v.name}, Kec. {v.districtName}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary">
          Buka
        </button>
      </form>

      {withoutBoard.length > 0 && (
        <section aria-labelledby="judul-tanpa-papan" className="mt-8">
          <h2 id="judul-tanpa-papan" className="text-lg">
            Desa dengan laporan tapi belum ada papan
          </h2>
          <ul className="panel mt-2 divide-y divide-line">
            {withoutBoard.map((code) => {
              const v = findVillage(code);
              return (
                <li key={code} className="flag-action">
                  <Link href={`/petugas/papan/${villageSlug(code)}`} className="block px-4 py-2">
                    {v ? villageLabel(v) : code}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section aria-labelledby="judul-terbit" className="mt-8">
        <h2 id="judul-terbit" className="text-lg">
          Sudah diterbitkan
        </h2>
        {boards.length === 0 ? (
          <p className="text-ink-2">Belum ada papan info yang diterbitkan.</p>
        ) : (
          <ul className="panel mt-2 divide-y divide-line">
            {boards.map((b) => {
              const v = findVillage(b.villageCode);
              return (
                <li key={b.villageCode}>
                  <Link
                    href={`/petugas/papan/${villageSlug(b.villageCode)}`}
                    className="block px-4 py-2"
                  >
                    <span className="font-semibold">{v ? villageLabel(v) : b.villageCode}</span>
                    <span className="block text-sm text-ink-2">
                      Terbit <span className="num">{formatDateTime(b.publishedAt)}</span> oleh{" "}
                      {b.publishedBy}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
