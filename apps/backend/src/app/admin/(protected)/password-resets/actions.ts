"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPermission } from "@/presentation/admin-session";
import { adminApi } from "@/presentation/sahl-api";
import { RESET_CODE_COOKIE } from "./shared";

// Through the SAHL API (apps/api), which enforces users.manage itself.
// The generated code goes to the page in a short-lived httpOnly cookie
// (never in the URL, so it doesn't end up in browser history or logs).
export async function issueResetCodeAction(requestId: string): Promise<void> {
  await requireAdminPermission("users.manage");
  const { code, expiresAt } = await adminApi<{ code: string; expiresAt: string }>(
    `/admin/password-resets/${requestId}/issue`,
    { method: "POST" },
  );
  const store = await cookies();
  store.set(RESET_CODE_COOKIE, JSON.stringify({ requestId, code, expiresAt }), {
    httpOnly: true,
    sameSite: "strict",
    path: "/admin/password-resets",
    maxAge: 120,
  });
  revalidatePath("/admin/password-resets");
  redirect("/admin/password-resets?status=CODE_ISSUED");
}

export async function cancelResetAction(requestId: string): Promise<void> {
  await requireAdminPermission("users.manage");
  await adminApi(`/admin/password-resets/${requestId}/cancel`, { method: "POST" });
  revalidatePath("/admin/password-resets");
}

export async function dismissResetCodeAction(): Promise<void> {
  const store = await cookies();
  store.delete({ name: RESET_CODE_COOKIE, path: "/admin/password-resets" });
  revalidatePath("/admin/password-resets");
}
