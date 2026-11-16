import { expect, test, type Page } from "@playwright/test";
import { uniqueIp } from "../e2e/helpers";

// Audit desain: semua halaman, termasuk state kosong, error, dan laporan mendesak.
// AUDIT_STAGE=before|after menentukan folder tujuan di docs/design-audit/.
const stage = process.env.AUDIT_STAGE ?? "before";

const shot = (page: Page, name: string) =>
  page.screenshot({
    path: `docs/design-audit/${stage}/${name}-${test.info().project.name}.png`,
    fullPage: true,
  });

test.beforeEach(async ({ context }) => {
  await context.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
});

test("korban: halaman tanpa sesi demo dan state kosong", async ({ page }) => {
  await page.goto("/");
  await shot(page, "k01-beranda");
  await page.goto("/info");
  await shot(page, "k02-info-kosong");
  await page.goto("/info/1709011001");
  await shot(page, "k03-papan-belum-ada");
  await page.goto("/status");
  await shot(page, "k04-cek-status");
  await page.getByLabel("Kode laporan").fill("TS-123");
  await page.getByRole("button", { name: "Lihat status" }).click();
  await shot(page, "k05-cek-status-galat");
  await page.goto("/status/TS-2222-3333");
  await shot(page, "k06-status-tidak-ditemukan");
  await page.goto("/cara-kerja");
  await shot(page, "k07-cara-kerja");
  await page.goto("/halaman-tidak-ada");
  await shot(page, "k08-404");
});

test("korban: alur lapor sampai papan info", async ({ page, context }) => {
  await page.goto("/demo/korban");
  await shot(page, "k10-lapor");
  await page.getByRole("button", { name: "Kirim laporan" }).click();
  await expect(page.getByText(/Laporan belum bisa dikirim/)).toBeVisible();
  await shot(page, "k11-lapor-galat");

  await page.getByLabel("Desa Anda").fill("pekik");
  await shot(page, "k12-lapor-cari-desa");
  await page.getByRole("button", { name: /Desa Pekik Nyaring/ }).click();
  await page.getByRole("checkbox", { name: "Evakuasi/terjebak" }).check();
  await page.getByRole("checkbox", { name: "Obat/perawatan" }).check();
  await page.getByLabel("Lansia").check();
  await page
    .getByLabel("Ceritakan apa yang terjadi")
    .fill("mbah putri gk bs jalan, air udh masuk rmh");
  await page.getByLabel(/Saya setuju laporan ini disimpan/).check();
  await shot(page, "k13-lapor-terisi");

  await context.setOffline(true);
  await page.getByRole("button", { name: "Kirim laporan" }).click();
  await expect(page.getByText("Laporan belum terkirim karena sinyal.")).toBeVisible({
    timeout: 15_000,
  });
  await shot(page, "k14-lapor-tanpa-sinyal");
  await context.setOffline(false);

  await page.getByRole("button", { name: "Coba kirim lagi" }).click();
  await expect(
    page.getByRole("heading", { name: "Laporan Anda sudah kami terima." }),
  ).toBeVisible();
  await shot(page, "k15-tanda-terima");
  const code = (await page.locator(".code-text").first().textContent())!;

  await page.goto("/info");
  await shot(page, "k16-daftar-papan");
  await page.goto("/info/1709032011");
  await shot(page, "k17-papan-info");
  await page.getByLabel("Pertanyaan").fill("ada dokter di posko?");
  await page.getByRole("button", { name: "Tanya" }).click();
  await expect(page.getByText("Belum ada informasi resmi untuk itu.")).toBeVisible();
  await shot(page, "k18-papan-tanya-belum-ada");

  await page.goto("/demo/petugas");
  await page.getByRole("list", { name: "Laporan mendesak" }).getByRole("link").first().click();
  await page.getByRole("button", { name: "Masuk laporan resmi" }).click();
  await page.goto(`/status/${code}`);
  await shot(page, "k19-status-berjalan");
});

test("petugas", async ({ page }) => {
  await page.goto("/petugas/masuk");
  await shot(page, "p01-masuk");
  await page.goto("/demo/petugas");
  await shot(page, "p02-antrean");
  await page.goto("/petugas?status=resmi");
  await shot(page, "p03-antrean-kosong");
  await page.goto("/petugas");
  await page.getByRole("list", { name: "Laporan mendesak" }).getByRole("link").first().click();
  await expect(page.getByRole("heading", { name: /Laporan TS-/ })).toBeVisible();
  await shot(page, "p04-laporan-mendesak");

  await page.goto("/petugas/tambah-whatsapp");
  await shot(page, "p05-tambah-whatsapp");
  await page.getByRole("button", { name: "Pakai contoh chat" }).click();
  await page.getByRole("button", { name: /^Proses \d+ pesan$/ }).click();
  await expect(page.getByText(/laporan masuk antrean/)).toBeVisible({ timeout: 30_000 });
  await shot(page, "p06-tambah-whatsapp-selesai");

  await page.goto("/petugas/kejadian");
  await shot(page, "p07-kejadian");
  await page
    .getByRole("link", { name: /Desa Pekik Nyaring/ })
    .first()
    .click();
  await shot(page, "p08-meja-periksa");

  await page.goto("/petugas/papan");
  await shot(page, "p09-daftar-papan");
  await page.goto("/petugas/papan/1709032011");
  await shot(page, "p10-sunting-papan");
});
