import Fuse from "fuse.js";
import { normalizeText } from "@/lib/text/normalize";

// Normalisasi lokasi: cocokkan teks lokasi bebas dengan daftar desa.
// Fungsi menerima daftar desa sebagai argumen supaya mudah diuji.

export type VillageRef = { code: string; name: string; districtName: string };

export type LocationMatch =
  | { kind: "cocok"; village: VillageRef; score: number }
  | { kind: "ambigu"; candidates: VillageRef[] }
  | { kind: "tidak_ada" };

const PREFIX = /\b(desa|ds|kelurahan|kel|dusun|dsn|kampung|kp|kec|kecamatan)\b\.?/g;

function clean(text: string): string {
  return normalizeText(text)
    .replace(PREFIX, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchLocation(text: string | null, villages: VillageRef[]): LocationMatch {
  if (!text) return { kind: "tidak_ada" };
  const query = clean(text);
  if (query.length < 3) return { kind: "tidak_ada" };

  const padded = ` ${query} `;
  const contains = (name: string) => padded.includes(` ${clean(name)} `);
  const exact = villages.filter((v) => contains(v.name));
  // Pilih nama terpanjang yang muncul utuh, mis. "Talang Empat" mengalahkan "Talang".
  if (exact.length > 0) {
    const longest = Math.max(...exact.map((v) => clean(v.name).length));
    const best = exact.filter((v) => clean(v.name).length === longest);
    if (best.length === 1 && best[0]) return { kind: "cocok", village: best[0], score: 0 };
    // Nama kecamatan dicari di sisa teks, karena nama desa bisa sama dengan kecamatannya.
    const inDistrict = best.filter((v) => {
      const rest = padded.replace(` ${clean(v.name)} `, " ");
      return rest.includes(` ${clean(v.districtName)} `);
    });
    if (inDistrict.length === 1 && inDistrict[0])
      return { kind: "cocok", village: inDistrict[0], score: 0 };
    return { kind: "ambigu", candidates: best.slice(0, 5) };
  }

  const fuse = new Fuse(villages, {
    keys: [{ name: "name", getFn: (v) => clean(v.name) }],
    includeScore: true,
    threshold: 0.3,
    ignoreLocation: true,
  });
  const hits = fuse.search(query).slice(0, 5);
  const first = hits[0];
  if (!first || first.score === undefined) return { kind: "tidak_ada" };
  const second = hits[1];
  // Selisih skor kecil berarti dua desa sama-sama mungkin: serahkan ke petugas/LLM.
  if (second && second.score !== undefined && second.score - first.score < 0.05) {
    return { kind: "ambigu", candidates: hits.map((h) => h.item) };
  }
  return { kind: "cocok", village: first.item, score: first.score };
}
