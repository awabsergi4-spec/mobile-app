"use server";

import { redirect } from "next/navigation";
import { clearAdminSessionCookies } from "@/presentation/admin-session";

export async function adminLogoutAction(): Promise<void> {
  await clearAdminSessionCookies();
  redirect("/admin/login");
}
