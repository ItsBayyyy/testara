import { redirect } from "next/navigation";
import { leaveDemo } from "@/lib/demo/session";

export async function GET() {
  await leaveDemo();
  redirect("/");
}
