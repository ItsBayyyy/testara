import { COUNT_FIELDS, type Claim, type DroppedClaim } from "@/lib/domain/types";
import { locateQuote } from "@/lib/text/normalize";
import { numbersInText } from "@/lib/text/numbers";

const COUNT_SET = new Set<string>(COUNT_FIELDS);

export function isCountField(field: string): boolean {
  return COUNT_SET.has(field);
}

/**
 * Verifikasi kutipan (CLAUDE.md 4D): kutipan wajib ada di teks sumbernya,
 * dan angka klaim hitungan wajib bisa ditelusuri ke kutipan itu.
 * Klaim yang gagal dibuang dan dicatat beserta alasannya.
 */
export function verifyClaims(
  claims: Claim[],
  sourceById: Record<string, string>,
): { kept: Claim[]; dropped: DroppedClaim[] } {
  const kept: Claim[] = [];
  const dropped: DroppedClaim[] = [];
  for (const claim of claims) {
    const reason = rejectReason(claim, sourceById[claim.messageId]);
    if (reason) dropped.push({ claim, reason });
    else kept.push(claim);
  }
  return { kept, dropped };
}

function rejectReason(claim: Claim, source: string | undefined): string | null {
  if (source === undefined) return "pesan sumber tidak ditemukan";
  if (!claim.quote.trim()) return "kutipan kosong";
  if (!locateQuote(source, claim.quote)) return "kutipan tidak ada di pesan sumber";
  if (isCountField(claim.field)) {
    if (typeof claim.value !== "number" || !Number.isFinite(claim.value) || claim.value < 0) {
      return "nilai hitungan bukan angka";
    }
    if (!numbersInText(claim.quote).includes(claim.value)) {
      return "angka tidak ada di kutipan";
    }
  } else if (typeof claim.value !== "string" || !claim.value.trim()) {
    return "nilai teks kosong";
  }
  return null;
}

/** Kutipan urgensi dari AI hanya dipakai jika benar-benar ada di cerita. */
export function verifiedQuoteOrNull(source: string, quote: string | null): string | null {
  if (!quote) return null;
  const range = locateQuote(source, quote);
  return range ? source.slice(range.start, range.end) : null;
}
