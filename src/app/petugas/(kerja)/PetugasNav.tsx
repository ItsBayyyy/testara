"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/petugas", label: "Antrean" },
  { href: "/petugas/tambah-whatsapp", label: "Tambah dari WhatsApp" },
  { href: "/petugas/kejadian", label: "Kejadian" },
  { href: "/petugas/papan", label: "Papan info" },
] as const;

export function PetugasNav() {
  const path = usePathname();
  return (
    <nav aria-label="Menu petugas">
      <ul className="flex flex-wrap gap-x-5">
        {ITEMS.map((item) => {
          const active =
            item.href === "/petugas" ? path === "/petugas" : path.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`inline-block py-2 ${active ? "font-bold underline decoration-2" : "no-underline hover:underline"}`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
