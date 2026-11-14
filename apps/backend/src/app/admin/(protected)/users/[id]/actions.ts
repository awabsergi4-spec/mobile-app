"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/presentation/admin-session";
import { adminApi } from "@/presentation/sahl-api";

// All three go through the SAHL API (apps/api), which enforces users.manage
// itself; the local permission check keeps the fail-closed UI behaviour.
export async function approveUserAction(userId: string): Promise<void> {
  await requireAdminPermission("users.manage");
  await adminApi(`/admin/users/${userId}/approve`, { method: "POST" });
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
}

export async function suspendUserAction(userId: string, formData: FormData): Promise<void> {
  await requireAdminPermission("users.manage");
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 3) {
    throw new Error("A reason of at least 3 characters is required.");
  }
  await adminApi(`/admin/users/${userId}/suspend`, { method: "POST", body: { reason } });
  revalidatePath(`/admin/users/${userId}`);
}

export async function reactivateUserAction(userId: string): Promise<void> {
  await requireAdminPermission("users.manage");
  await adminApi(`/admin/users/${userId}/reactivate`, { method: "POST" });
  revalidatePath(`/admin/users/${userId}`);
}
