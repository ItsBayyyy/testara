import { redirect } from "next/navigation";
import { ensureDemoSession } from "@/lib/demo/session";

export async function GET() {
  await ensureDemoSession();
  redirect("/lapor");
}
