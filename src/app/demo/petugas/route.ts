import { redirect } from "next/navigation";
import { enterDemoAsStaff } from "@/lib/demo/session";

// Masuk petugas demo dengan satu klik, tanpa kata sandi. Hanya berlaku di sesi demo.
export async function GET() {
  await enterDemoAsStaff();
  redirect("/petugas");
}
