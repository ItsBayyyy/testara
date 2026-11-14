import { expect, test } from "@playwright/test";
import path from "node:path";
import { useUniqueIp } from "./helpers";

useUniqueIp();

test.describe("sisi petugas (mode demo, AI mati)", () => {
  test("laporan korban muncul di atas antrean dan status korban ikut berubah", async ({ page }) => {
    await page.goto("/demo/korban");
    await expect(page.getByRole("heading", { name: "Lapor kejadian" })).toBeVisible();
    await page.getByLabel("Desa Anda").fill("srikat");
    await page.getByRole("button", { name: /Desa Srikaton/ }).click();
    await page.getByRole("checkbox", { name: "Obat/perawatan" }).check();
    await page.getByLabel("Lansia").check();
    await page
      .getByLabel("Ceritakan apa yang terjadi")
      .fill("mbah sy sakit, obat habis, jalan putus");
    await page.getByLabel(/Saya setuju laporan ini disimpan/).check();
    await page.getByRole("button", { name: "Kirim laporan" }).click();
    await expect(
      page.getByRole("heading", { name: "Laporan Anda sudah kami terima." }),
    ).toBeVisible();
    const code = (await page.locator(".code-text").first().textContent())!;

    await page.goto("/demo/petugas");
    const urgent = page.getByRole("list", { name: "Laporan mendesak" });
    const first = urgent.getByRole("link").first();
    await expect(first).toContainText("Srikaton");
    await expect(first).toContainText("belum dirapikan AI");
    await first.click();

    await expect(page.getByRole("heading", { name: `Laporan ${code}` })).toBeVisible();
    await expect(page.getByText("Belum dirapikan AI.")).toBeVisible();
    await expect(page.getByText("Ada orang yang perlu didahulukan dan butuh obat")).toBeVisible();
    await page.getByRole("button", { name: "Tandai dibaca" }).click();
    await expect(page.getByRole("button", { name: "Tandai dibaca" })).toHaveCount(0);
    await page.getByRole("button", { name: "Masuk laporan resmi" }).click();

    await page.goto(`/status/${code}`);
    const timeline = page.getByRole("list", { name: "Perkembangan laporan" });
    await expect(timeline).toContainText("Dibaca petugas, sudah");
    await expect(timeline).toContainText("Masuk laporan resmi, sudah");
  });

  test("tempel ekspor WhatsApp: pesan laporan masuk antrean, nomor disamarkan", async ({
    page,
  }) => {
    await page.goto("/demo/petugas");
    await page.getByRole("link", { name: "Tambah dari WhatsApp" }).click();
    await page
      .getByLabel("Atau unggah berkas .txt")
      .setInputFiles(path.join(__dirname, "fixtures/grup-kecil.txt"));
    await expect(page.getByText(/3\s*pesan terbaca/)).toBeVisible();
    await page.getByRole("button", { name: "Proses 3 pesan" }).click();
    await expect(page.getByText(/2 laporan masuk antrean\. 1 pesan bukan laporan/)).toBeVisible();

    await page.getByRole("link", { name: "Buka antrean" }).click();
    const item = page.getByRole("list", { name: "Laporan mendesak" }).getByRole("link").first();
    await expect(item).toContainText("dari WhatsApp");
    await item.click();
    await expect(page.getByText("[nomor disamarkan]")).toBeVisible();
    await expect(page.getByText("0812-0000-7777")).toHaveCount(0);
  });

  test("halaman petugas menolak tanpa masuk", async ({ page }) => {
    await page.goto("/petugas");
    await expect(page.getByRole("heading", { name: "Masuk petugas" })).toBeVisible();
    const res = await page.request.post("/api/whatsapp/extract", {
      data: { first: true, messages: [] },
    });
    expect(res.status()).toBe(401);
  });
  test("terbitkan papan info, warga melihat dan bertanya (AI mati)", async ({ page }) => {
    await page.goto("/demo/petugas");
    await page.getByRole("link", { name: "Papan info" }).click();
    await page
      .getByLabel("Sunting papan desa")
      .selectOption({ label: "Srikaton, Kec. Pondok Kelapa" });
    await page.getByRole("button", { name: "Buka" }).click();
    await expect(page.getByRole("heading", { name: "Papan info Desa Srikaton" })).toBeVisible();

    await page.getByRole("button", { name: "Tambah pengungsian" }).click();
    await page.getByLabel("Nama tempat").fill("Masjid Al Huda");
    await page.getByLabel("Lokasi", { exact: true }).fill("Dusun 1, dekat pasar");
    await page.getByRole("button", { name: "Tambah kontak" }).click();
    await page.getByLabel("Nama posko/petugas").fill("Posko Srikaton (nomor contoh)");
    await page.getByLabel("Nomor telepon").fill("0812-0000-0202");
    await page.getByRole("button", { name: "Terbitkan papan info" }).click();
    await expect(page.getByText("Papan info diterbitkan.")).toBeVisible();
    await expect(page.getByText("(tampil sekarang)")).toBeVisible();

    await page.goto("/info/1709032010");
    await expect(page.getByRole("heading", { name: "Papan info Desa Srikaton" })).toBeVisible();
    await expect(page.getByText("Masjid Al Huda")).toBeVisible();
    await page.getByLabel("Pertanyaan").fill("posko terdekat di mana?");
    await page.getByRole("button", { name: "Tanya" }).click();
    await expect(page.getByText("Belum ada informasi resmi untuk itu.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Pengungsian: Masjid Al Huda" })).toBeVisible();
    await expect(page.getByRole("link", { name: "0812-0000-0202" }).first()).toBeVisible();
  });
});
