"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPermission } from "@/presentation/admin-session";
import { adminApi, SahlApiError } from "@/presentation/sahl-api";
import type { AdminCategory } from "./api";

// Through the SAHL API (apps/api), which enforces services.manage itself;
// the local check keeps the fail-closed UI behaviour.
function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function errorMessage(err: unknown): string {
  if (err instanceof SahlApiError) {
    if (err.errorCode === "CATEGORY_EXISTS") return "A category with this English name already exists for this type.";
    if (err.errorCode === "VALIDATION_ERROR") return "Check the fields: names need at least 2 characters.";
    return err.message;
  }
  throw err;
}

export async function createCategoryAction(formData: FormData): Promise<void> {
  await requireAdminPermission("services.manage");
  let created: AdminCategory;
  try {
    created = await adminApi<AdminCategory>("/admin/service-categories", {
      method: "POST",
      body: {
        type: text(formData, "type"),
        nameEn: text(formData, "nameEn"),
        nameAr: text(formData, "nameAr"),
        descriptionEn: text(formData, "descriptionEn") || null,
        descriptionAr: text(formData, "descriptionAr") || null,
        isActive: true,
      },
    });
  } catch (err) {
    redirect(`/admin/categories?error=${encodeURIComponent(errorMessage(err))}`);
  }
  revalidatePath("/admin/categories");
  redirect(`/admin/categories?created=${encodeURIComponent(created.nameEn ?? "")}`);
}

export async function updateCategoryAction(categoryId: string, formData: FormData): Promise<void> {
  await requireAdminPermission("services.manage");
  try {
    await adminApi(`/admin/service-categories/${categoryId}`, {
      method: "PATCH",
      body: {
        nameEn: text(formData, "nameEn"),
        nameAr: text(formData, "nameAr"),
        descriptionEn: text(formData, "descriptionEn") || null,
        descriptionAr: text(formData, "descriptionAr") || null,
      },
    });
  } catch (err) {
    redirect(`/admin/categories/${categoryId}?error=${encodeURIComponent(errorMessage(err))}`);
  }
  revalidatePath("/admin/categories");
  redirect(`/admin/categories/${categoryId}?saved=1`);
}

export async function setCategoryActiveAction(categoryId: string, isActive: boolean): Promise<void> {
  await requireAdminPermission("services.manage");
  await adminApi(`/admin/service-categories/${categoryId}`, { method: "PATCH", body: { isActive } });
  revalidatePath("/admin/categories");
  revalidatePath(`/admin/categories/${categoryId}`);
}
