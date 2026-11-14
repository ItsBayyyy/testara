import data from "../../../data/wilayah/bengkulu.json";

// Data wilayah Kemendagri (subset Provinsi Bengkulu). Sumber dan lisensi:
// data/wilayah/SOURCE.md. Aplikasi melayani satu kabupaten (REGENCY_CODE).

export type Village = {
  code: string;
  name: string;
  type: "desa" | "kelurahan";
  districtCode: string;
  districtName: string;
};

type RawVillage = { code: string; name: string; type: string };
type RawDistrict = { code: string; name: string; villages: RawVillage[] };
type RawRegency = { code: string; name: string; districts: RawDistrict[] };

const regencies = (data as { regencies: RawRegency[] }).regencies;

export const DEFAULT_REGENCY_CODE = "17.09";

export function regencyCode(): string {
  return process.env.REGENCY_CODE?.trim() || DEFAULT_REGENCY_CODE;
}

export function getRegency(code = regencyCode()): { code: string; name: string } {
  const r = regencies.find((x) => x.code === code);
  if (!r) throw new Error(`Kode kabupaten ${code} tidak ada di data wilayah`);
  return { code: r.code, name: r.name };
}

export function listVillages(code = regencyCode()): Village[] {
  const r = regencies.find((x) => x.code === code);
  if (!r) return [];
  return r.districts.flatMap((d) =>
    d.villages.map((v) => ({
      code: v.code,
      name: v.name,
      type: v.type === "kelurahan" ? "kelurahan" : "desa",
      districtCode: d.code,
      districtName: d.name,
    })),
  );
}

export function findVillage(code: string | null | undefined): Village | null {
  if (!code) return null;
  return listVillages().find((v) => v.code === code) ?? null;
}

/** Kode tanpa titik untuk URL: 17.09.01.2001 -> 1709012001. */
export function villageSlug(code: string): string {
  return code.replace(/\./g, "");
}

export function villageFromSlug(slug: string): Village | null {
  return listVillages().find((v) => villageSlug(v.code) === slug) ?? null;
}

export function villageLabel(v: Village): string {
  return `${v.type === "kelurahan" ? "Kelurahan" : "Desa"} ${v.name}`;
}
