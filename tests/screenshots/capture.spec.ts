import { expect, test, type Page } from "@playwright/test";
import { uniqueIp } from "../e2e/helpers";

const shot = (page: Page, name: string) =>
  page.screenshot({
    path: `docs/screenshots/${name}-${test.info().project.name}.png`,
    fullPage: true,
  });

test.beforeEach(async ({ context }) => {
  await context.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
});

test("sisi korban", async ({ page, context }) => {
  await page.goto("/");
  await shot(page, "01-beranda");
  await page.goto("/demo/korban");
  await shot(page, "02-lapor");

  await page.getByRole("button", { name: "Kirim laporan" }).click();
  await expect(page.getByText(/Laporan belum bisa dikirim/)).toBeVisible();
  await shot(page, "03-lapor-galat");

  await page.getByLabel("Desa Anda").fill("pekik");
  await page.getByRole("button", { name: /Desa Pekik Nyaring/ }).click();
  await page.getByRole("checkbox", { name: "Evakuasi/terjebak" }).check();
  await page.getByLabel("Lansia").check();
  await page
    .getByLabel("Ceritakan apa yang terjadi")
    .fill("mbah putri gk bs jalan, air udh masuk rmh");
  await page.getByLabel(/Saya setuju laporan ini disimpan/).check();

  await context.setOffline(true);
  await page.getByRole("button", { name: "Kirim laporan" }).click();
  await expect(page.getByText("Laporan belum terkirim karena sinyal.")).toBeVisible({
    timeout: 15_000,
  });
  await shot(page, "04-lapor-tanpa-sinyal");
  await context.setOffline(false);

  await page.getByRole("button", { name: "Coba kirim lagi" }).click();
  await expect(
    page.getByRole("heading", { name: "Laporan Anda sudah kami terima." }),
  ).toBeVisible();
  await shot(page, "05-tanda-terima");

  await page.goto("/info/1709032011");
  await page.getByLabel("Pertanyaan").fill("di mana ambil air bersih?");
  await page.getByRole("button", { name: "Tanya" }).click();
  await expect(page.getByText("Belum ada informasi resmi untuk itu.")).toBeVisible();
  await shot(page, "06-papan-info-tanya");
});

test("sisi petugas", async ({ page }) => {
  await page.goto("/demo/petugas");
  await shot(page, "07-antrean");
  await page.getByRole("list", { name: "Laporan mendesak" }).getByRole("link").first().click();
  await expect(page.getByRole("heading", { name: /Laporan TS-/ })).toBeVisible();
  await shot(page, "08-detail-laporan");
  await page.getByRole("button", { name: "Tandai dibaca" }).click();

  await page.goto("/petugas/kejadian");
  await shot(page, "09-kejadian");
  await page
    .getByRole("link", { name: /Desa Pekik Nyaring/ })
    .first()
    .click();
  await shot(page, "10-meja-periksa");

  await page.goto("/petugas/papan/1709032011");
  await shot(page, "11-sunting-papan");
});
