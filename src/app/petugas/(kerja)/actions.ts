"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, staffScope } from "@/lib/auth/staff";
import { getStore } from "@/lib/db";
import { transitionSteps } from "@/lib/domain/status";
import { REPORT_STATUSES, URGENCIES, type ReportStatus, type Urgency } from "@/lib/domain/types";
import { processReport } from "@/lib/reports/process";
import { findVillage } from "@/lib/wilayah";

// Tindakan petugas atas laporan. Setiap tindakan memeriksa petugas dan lingkup
// datanya; perubahan status langsung terlihat di halaman status korban.

export async function setReportStatus(formData: FormData): Promise<void> {
  const staff = await requireStaff();
  const scope = staffScope(staff);
  const id = String(formData.get("id"));
  const to = String(formData.get("status")) as ReportStatus;
  if (!REPORT_STATUSES.includes(to)) return;

  const store = getStore();
  const report = await store.getReport(id, scope);
  if (!report) return;
  const steps = transitionSteps(report.status, to);
  if (steps.length === 0) return;

  const now = Date.now();
  await store.updateReport(id, scope, { status: to });
  await store.addEvents(
    // Jeda 1 ms menjaga urutan linimasa saat "Dibaca" dan status akhir dicatat bersamaan.
    steps.map((status, i) => ({
      reportId: id,
      status,
      actor: "petugas" as const,
      createdAt: new Date(now + i).toISOString(),
    })),
  );
  revalidatePath("/petugas", "layout");
  revalidatePath(`/status/${report.publicCode}`);
}

export async function setReportUrgency(formData: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = String(formData.get("id"));
  const urgency = String(formData.get("urgency")) as Urgency;
  if (!URGENCIES.includes(urgency)) return;
  await getStore().updateReport(id, staffScope(staff), {
    urgency,
    urgencySource: "petugas",
    urgencyReason: `Diubah oleh ${staff.name}.`,
    urgencyQuote: null,
  });
  revalidatePath("/petugas", "layout");
}

export async function setReportVillage(formData: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = String(formData.get("id"));
  const code = String(formData.get("villageCode"));
  if (!findVillage(code)) return;
  await getStore().updateReport(id, staffScope(staff), { villageCode: code });
  revalidatePath("/petugas", "layout");
}

export async function retryReportAi(formData: FormData): Promise<void> {
  const staff = await requireStaff();
  const scope = staffScope(staff);
  const id = String(formData.get("id"));
  const store = getStore();
  const report = await store.getReport(id, scope);
  if (!report || report.aiState === "selesai") return;
  if (report.aiState === "gagal") await store.updateReport(id, scope, { aiState: "menunggu" });
  await processReport(id, scope).catch(() => null);
  revalidatePath("/petugas", "layout");
}
