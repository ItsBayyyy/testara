import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { varyClientIp } from "./helpers";

varyClientIp();

// Pemeriksaan aksesibilitas otomatis (WCAG 2 A dan AA, termasuk kontras) di halaman korban.
async function expectNoViolations(page: import("@playwright/test").Page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  const summary = result.violations.map((v) => `${v.id}: ${v.nodes.length} elemen`);
  expect(summary).toEqual([]);
}

test("halaman korban lolos axe", async ({ page }) => {
  for (const path of ["/", "/lapor", "/status", "/info", "/cara-kerja", "/privasi"]) {
    await page.goto(path);
    await expectNoViolations(page);
  }

  await page.goto("/demo/korban");
  await page.getByRole("button", { name: "Kirim laporan" }).click();
  await expect(page.getByText(/Laporan belum bisa dikirim/)).toBeVisible();
  await expectNoViolations(page);

  await page.getByRole("checkbox", { name: "Makanan" }).check();
  await page.getByLabel("Ceritakan apa yang terjadi").fill("beras habis, desa srikaton");
  await page.getByLabel(/Saya setuju laporan ini disimpan/).check();
  await page.getByRole("button", { name: "Kirim laporan" }).click();
  await expect(
    page.getByRole("heading", { name: "Laporan Anda sudah kami terima." }),
  ).toBeVisible();
  await expectNoViolations(page);

  await page.goto("/info/1709032011");
  await page.getByLabel("Pertanyaan").fill("ada dokter?");
  await page.getByRole("button", { name: "Tanya" }).click();
  await expect(page.getByText("Belum ada informasi resmi untuk itu.")).toBeVisible();
  await expectNoViolations(page);
});
