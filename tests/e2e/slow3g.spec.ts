import { expect, test } from "@playwright/test";
import { uniqueIp, varyClientIp } from "./helpers";

varyClientIp();

// Halaman lapor harus tetap bisa diisi dan dikirim pada jaringan "Slow 3G"
// (preset DevTools: latensi 2 detik, unduh sekitar 50 KB/detik, unggah sekitar 50 KB/detik).
test("lapor tetap terkirim pada jaringan lambat", async ({ page, context }) => {
  test.setTimeout(120_000);
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 2000,
    downloadThroughput: (500 * 1024) / 8,
    uploadThroughput: (500 * 1024) / 8,
  });

  const t0 = Date.now();
  await page.goto("/lapor", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Kirim laporan" })).toBeVisible();
  const firstView = Date.now() - t0;

  await page.getByRole("checkbox", { name: "Air bersih" }).check();
  await page.getByLabel("Ceritakan apa yang terjadi").fill("air bersih habis di dusun 2 srikaton");
  await page.getByLabel(/Saya setuju laporan ini disimpan/).check();
  await page.getByRole("button", { name: "Kirim laporan" }).click();
  await expect(page.getByRole("heading", { name: "Laporan Anda sudah kami terima." })).toBeVisible({
    timeout: 60_000,
  });
  test
    .info()
    .annotations.push({ type: "waktu tampil formulir (ms)", description: String(firstView) });
});

test("tanpa JavaScript laporan tetap terkirim lewat formulir biasa", async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    extraHTTPHeaders: { "x-forwarded-for": uniqueIp() },
  });
  const page = await context.newPage();
  await page.goto("/lapor");
  await page.getByLabel("Desa Anda").fill("srikaton");
  await page.getByRole("checkbox", { name: "Makanan" }).check();
  await page.getByLabel("Ceritakan apa yang terjadi").fill("beras habis");
  await page.getByLabel(/Saya setuju laporan ini disimpan/).check();
  await page.getByRole("button", { name: "Kirim laporan" }).click();
  await expect(
    page.getByRole("heading", { name: "Laporan Anda sudah kami terima." }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Lihat papan info Desa Srikaton/ })).toBeVisible();

  await page.goto("/lapor");
  await page.getByRole("button", { name: "Kirim laporan" }).click();
  await expect(page.getByText("Laporan belum terkirim:")).toBeVisible();
  await context.close();
});
