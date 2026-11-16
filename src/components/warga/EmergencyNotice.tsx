/**
 * Ajakan menelepon nomor darurat. Selalu tampil paling atas di halaman lapor,
 * dengan warna tinta yang tidak dipakai blok lain sehingga mudah dikenali.
 */
export function EmergencyNotice({ number }: { number: string }) {
  const tel = number.replace(/[^\d+]/g, "");
  return (
    <section
      aria-labelledby="darurat-judul"
      className="alert-call flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-4"
    >
      <div>
        <h2 id="darurat-judul" className="text-base">
          Ada yang terancam nyawanya?
        </h2>
        <p className="text-sm">
          Telepon {number} sekarang. Testara tidak menggantikan layanan darurat.
        </p>
      </div>
      <a
        href={`tel:${tel}`}
        className="btn min-w-40 border-white bg-white text-ink hover:bg-bg active:bg-line"
      >
        Telepon {number}
      </a>
    </section>
  );
}
