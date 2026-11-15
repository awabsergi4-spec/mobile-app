"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPermission } from "@/presentation/admin-session";
import { adminApi } from "@/presentation/sahl-api";

// Through the SAHL API (apps/api), which enforces services.manage itself.
export async function approveListingAction(listingId: string): Promise<void> {
  await requireAdminPermission("services.manage");
  await adminApi(`/admin/listings/${listingId}/approve`, { method: "POST" });
  revalidatePath("/admin/listings");
  redirect("/admin/listings");
}

export async function rejectListingAction(listingId: string, formData: FormData): Promise<void> {
  await requireAdminPermission("services.manage");
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 3) {
    redirect(`/admin/listings/${listingId}?error=reason`);
  }
  await adminApi(`/admin/listings/${listingId}/reject`, { method: "POST", body: { reason } });
  revalidatePath("/admin/listings");
  redirect("/admin/listings");
}
