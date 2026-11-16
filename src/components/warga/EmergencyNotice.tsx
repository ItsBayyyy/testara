/** Ajakan menelepon nomor darurat. Selalu tampil di atas formulir lapor. */
export function EmergencyNotice({ number }: { number: string }) {
  const tel = number.replace(/[^\d+]/g, "");
  return (
    <section
      aria-labelledby="darurat-judul"
      className="flag-action notice flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3"
    >
      <div>
        <h2 id="darurat-judul" className="text-base">
          Ada yang terancam nyawanya?
        </h2>
        <p className="text-base text-ink-2">
          Telepon {number} sekarang. Testara tidak menggantikan layanan darurat.
        </p>
      </div>
      <a href={`tel:${tel}`} className="btn btn-secondary">
        Telepon {number}
      </a>
    </section>
  );
}
