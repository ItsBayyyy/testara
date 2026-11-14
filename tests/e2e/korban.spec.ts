import { expect, test } from "@playwright/test";
import { useUniqueIp } from "./helpers";

useUniqueIp();

test.describe("sisi korban", () => {
  test("kirim laporan, terima kode, lihat status", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Saya perlu bantuan / mau melapor" }).click();
    await expect(page.getByRole("heading", { name: "Lapor kejadian" })).toBeVisible();
    await expect(page.getByText("Ada yang terancam nyawanya?")).toBeVisible();

    await page.getByLabel("Desa Anda").fill("taba teru");
    await page.getByRole("button", { name: /Desa Taba Terunjam/ }).click();
    await page.getByRole("checkbox", { name: "Air bersih" }).check();
    await page.getByLabel("Lansia").check();
    await page.getByLabel("Ceritakan apa yang terjadi").fill("air sdh masuk rmh, nenek di dlm");
    await page.getByLabel(/Saya setuju laporan ini disimpan/).check();
    await page.getByRole("button", { name: "Kirim laporan" }).click();

    await expect(
      page.getByRole("heading", { name: "Laporan Anda sudah kami terima." }),
    ).toBeVisible();
    const code = await page.locator(".code-text").first().textContent();
    expect(code).toMatch(/^TS-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    await expect(page.getByText("bukan jaminan waktu kedatangan bantuan")).toBeVisible();
    await expect(page.getByText("air sdh masuk rmh")).toHaveCount(0);

    await page.goto("/status");
    await page.getByLabel("Kode laporan").fill(code!.toLowerCase().replace(/-/g, " "));
    await page.getByRole("button", { name: "Lihat status" }).click();
    await expect(page.getByRole("heading", { name: "Status laporan" })).toBeVisible();
    await expect(page.getByText(code!)).toBeVisible();
  });

  test("formulir kosong menunjukkan apa yang kurang", async ({ page }) => {
    await page.goto("/lapor");
    await page.getByRole("button", { name: "Kirim laporan" }).click();
    const alert = page.getByRole("alert").filter({ hasText: "Laporan belum bisa dikirim" });
    await expect(alert).toContainText("Pilih minimal satu kebutuhan, atau tulis ceritanya.");
    await expect(alert).toContainText("Centang persetujuan");
  });

  test("draf tetap ada setelah halaman dimuat ulang", async ({ page }) => {
    await page.goto("/lapor");
    await page.getByLabel("Ceritakan apa yang terjadi").fill("jalan ke dusun 2 putus");
    await page.getByRole("checkbox", { name: "Makanan" }).check();
    await page.reload();
    await expect(page.getByLabel("Ceritakan apa yang terjadi")).toHaveValue(
      "jalan ke dusun 2 putus",
    );
    await expect(page.getByRole("checkbox", { name: "Makanan" })).toBeChecked();
  });

  test("tanpa sinyal: tawarkan kirim lewat WhatsApp", async ({ page, context }) => {
    await page.goto("/lapor");
    await page.getByRole("checkbox", { name: "Evakuasi/terjebak" }).check();
    await page
      .getByLabel("Ceritakan apa yang terjadi")
      .fill("kakek terjebak di loteng, desa srikaton");
    await page.getByLabel(/Saya setuju laporan ini disimpan/).check();
    await context.setOffline(true);
    await page.getByRole("button", { name: "Kirim laporan" }).click();

    await expect(page.getByText("Laporan belum terkirim karena sinyal.")).toBeVisible({
      timeout: 15_000,
    });
    const wa = page.getByRole("link", { name: "Kirim lewat WhatsApp" });
    const href = await wa.getAttribute("href");
    expect(href).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);
    const text = decodeURIComponent(href!.split("?text=")[1]!);
    expect(text).toContain("Kebutuhan: Evakuasi/terjebak");
    expect(text).toContain("kakek terjebak di loteng");
    await expect(page.getByRole("button", { name: "Salin pesan" })).toBeVisible();

    await context.setOffline(false);
    await page.getByRole("button", { name: "Coba kirim lagi" }).click();
    await expect(
      page.getByRole("heading", { name: "Laporan Anda sudah kami terima." }),
    ).toBeVisible();
  });

  test("kode yang salah ketik diberi petunjuk", async ({ page }) => {
    await page.goto("/status");
    await page.getByLabel("Kode laporan").fill("TS-123");
    await page.getByRole("button", { name: "Lihat status" }).click();
    await expect(page.getByText("Kode harus 8 huruf/angka setelah TS")).toBeVisible();
  });
});

test("laporan keenam dalam satu jam dibatasi dan tetap ditawari WhatsApp", async ({ page }) => {
  for (let i = 0; i < 6; i++) {
    await page.goto("/lapor");
    await page.getByRole("checkbox", { name: "Makanan" }).check();
    await page.getByLabel(/Saya setuju laporan ini disimpan/).check();
    await page.getByLabel("Ceritakan apa yang terjadi").fill(`uji batas ${i}, desa srikaton`);
    await page.getByRole("button", { name: "Kirim laporan" }).click();
    if (i < 5)
      await expect(
        page.getByRole("heading", { name: "Laporan Anda sudah kami terima." }),
      ).toBeVisible();
  }
  await expect(page.getByText(/Sudah 5 laporan dari jaringan ini dalam satu jam/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Kirim lewat WhatsApp" })).toBeVisible();
});
