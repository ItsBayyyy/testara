import { test } from "@playwright/test";

/** Alamat IP acak per tes supaya batas 5 laporan per jam tidak saling memengaruhi. */
export function uniqueIp(): string {
  const n = () => Math.floor(Math.random() * 250) + 1;
  return `10.${n()}.${n()}.${n()}`;
}

export function varyClientIp() {
  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
  });
}
