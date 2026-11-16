import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { normalizePublicCode } from "@/lib/domain/code";

export const metadata: Metadata = { title: "Cek status laporan" };

async function openStatus(formData: FormData) {
  "use server";
  const raw = String(formData.get("kode") ?? "");
  const code = normalizePublicCode(raw);
  redirect(
    code ? `/status/${code}` : `/status?salah=1&kode=${encodeURIComponent(raw.slice(0, 20))}`,
  );
}

export default async function StatusLookupPage({ searchParams }: PageProps<"/status">) {
  const params = await searchParams;
  const wrong = params.salah === "1";
  const typed = typeof params.kode === "string" ? params.kode : "";
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl">Cek status laporan</h1>
      <form action={openStatus} className="flex flex-col gap-3">
        <label htmlFor="kode" className="label">
          Kode laporan <span className="font-normal text-ink-2">(dari karcis)</span>
        </label>
        <input
          id="kode"
          name="kode"
          className="field code-text text-lg uppercase"
          placeholder="TS-7K4Q-9M2X"
          defaultValue={typed}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={wrong ? true : undefined}
          aria-describedby={wrong ? "kode-error" : undefined}
          required
        />
        {wrong && (
          <p id="kode-error" className="error-text">
            Kode harus 8 huruf/angka setelah TS, contoh TS-7K4Q-9M2X. Periksa lagi kodenya.
          </p>
        )}
        <button type="submit" className="btn btn-primary">
          Lihat status
        </button>
      </form>
    </div>
  );
}
