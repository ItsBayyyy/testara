import { expect, test } from "@playwright/test";
import { varyClientIp } from "./helpers";

varyClientIp();

// Alur demo juri (CLAUDE.md 6.1) harus selesai kurang dari 2 menit, dengan AI mati.
test("alur demo juri: korban, petugas, papan info, kembali ke korban", async ({ page }) => {
  const started = Date.now();

  // 1. Korban: laporan bahasa santai dengan lansia.
  await page.goto("/");
  await page.getByRole("link", { name: "Coba sebagai korban" }).click();
  await expect(page.getByText("Mode demo, data contoh fiktif")).toBeVisible();
  await page.getByLabel("Desa Anda").fill("pekik");
  await page.getByRole("button", { name: /Desa Pekik Nyaring/ }).click();
  await page.getByRole("checkbox", { name: "Evakuasi/terjebak" }).check();
  await page.getByLabel("Lansia").check();
  await page
    .getByLabel("Ceritakan apa yang terjadi")
    .fill("mbah putri gk bs jalan, air udh masuk rmh");
  await page.getByLabel(/Saya setuju laporan ini disimpan/).check();
  await page.getByRole("button", { name: "Kirim laporan" }).click();
  await expect(
    page.getByRole("heading", { name: "Laporan Anda sudah kami terima." }),
  ).toBeVisible();
  const code = (await page.locator(".code-text").first().textContent())!;

  // 2. Petugas: laporan itu paling atas beserta alasan urgensinya.
  await page.getByRole("link", { name: "Buka sisi petugas" }).click();
  await expect(page.getByRole("heading", { name: /Antrean/ })).toContainText("13");
  await page.getByRole("list", { name: "Laporan mendesak" }).getByRole("link").first().click();
  await expect(page.getByRole("heading", { name: `Laporan ${code}` })).toBeVisible();
  await expect(page.getByText("Pelapor memilih kebutuhan evakuasi atau terjebak.")).toBeVisible();

  // 3. Tandai dibaca, masukkan laporan resmi, periksa kejadian, terbitkan papan info.
  await page.getByRole("button", { name: "Tandai dibaca" }).click();
  await page.getByRole("button", { name: "Masuk laporan resmi" }).click();
  await page.getByRole("link", { name: "Kejadian" }).click();
  await page
    .getByRole("link", { name: /Desa Pekik Nyaring/ })
    .first()
    .click();
  await page.getByRole("button", { name: "Simpan sebagai sudah diperiksa" }).click();
  await expect(page.getByText("Angka disimpan sebagai sudah diperiksa.")).toBeVisible();
  await page.getByRole("link", { name: "Papan info", exact: true }).click();
  await page
    .getByRole("link", { name: /Desa Pekik Nyaring/ })
    .first()
    .click();
  await page.getByRole("button", { name: "Tambah catatan" }).click();
  await page
    .getByLabel("Catatan", { exact: true })
    .last()
    .fill("Lansia yang perlu dijemput, laporkan lewat Testara.");
  await page.getByRole("button", { name: "Terbitkan papan info" }).click();
  await expect(page.getByText("Papan info diterbitkan.")).toBeVisible();

  // 4. Korban: status berubah, dan pertanyaan dijawab dari papan info.
  await page.goto(`/status/${code}`);
  await expect(page.getByRole("list", { name: "Perkembangan laporan" })).toContainText(
    "Masuk laporan resmi, sudah",
  );
  await page.getByRole("link", { name: /Lihat papan info Desa Pekik Nyaring/ }).click();
  await expect(page.getByText("Lansia yang perlu dijemput")).toBeVisible();
  await page.getByLabel("Pertanyaan").fill("posko terdekat?");
  await page.getByRole("button", { name: "Tanya" }).click();
  await expect(page.getByRole("link", { name: "Pengungsian: Masjid Nurul Iman" })).toBeVisible();

  expect(Date.now() - started).toBeLessThan(120_000);
});

test("sesi demo terisi data contoh dan tidak terlihat dari sesi lain", async ({
  page,
  browser,
}) => {
  await page.goto("/demo/petugas");
  await expect(page.getByRole("heading", { name: /Antrean/ })).toContainText("12");
  await expect(page.getByText("Mode demo untuk juri.")).toBeVisible();

  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await otherPage.goto("/info");
  await expect(otherPage.getByText("Belum ada papan info yang diterbitkan.")).toBeVisible();
  await other.close();
});

test("petugas demo bisa memakai contoh chat WhatsApp", async ({ page }) => {
  await page.goto("/demo/petugas");
  await page.getByRole("link", { name: "Tambah dari WhatsApp" }).click();
  await page.getByRole("button", { name: "Pakai contoh chat" }).click();
  await expect(page.getByText(/pesan terbaca/)).toContainText("Format Android");
  await page.getByRole("button", { name: /^Proses \d+ pesan$/ }).click();
  await expect(page.getByText(/laporan masuk antrean/)).toBeVisible({ timeout: 30_000 });
});
