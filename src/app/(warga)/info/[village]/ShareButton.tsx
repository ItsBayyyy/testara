"use client";

import { whatsappShareLink } from "@/lib/whatsapp/format";

/** Bagikan tautan papan info lewat WhatsApp; alamat diambil dari halaman yang sedang dibuka. */
export function ShareButton({ title }: { title: string }) {
  return (
    <button
      type="button"
      className="btn btn-secondary self-start"
      onClick={() => {
        const url = window.location.href.split("#")[0];
        window.open(whatsappShareLink(`${title}\n${url}`), "_blank", "noopener,noreferrer");
      }}
    >
      Bagikan ke WhatsApp
    </button>
  );
}
