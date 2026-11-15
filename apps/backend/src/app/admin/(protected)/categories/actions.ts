"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPermission } from "@/presentation/admin-session";
import { adminApi, SahlApiError } from "@/presentation/sahl-api";
import type { AdminCategory } from "./api";
import { ImageUploadError, uploadCategoryImage } from "./upload";

// Through the SAHL API (apps/api), which enforces services.manage itself;
// the local check keeps the fail-closed UI behaviour. Errors come back as
// an error code in the URL; the page shows the translated message.
function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function errorCode(err: unknown): string {
  if (err instanceof ImageUploadError) return err.message;
  if (err instanceof SahlApiError) {
    if (err.errorCode === "CATEGORY_EXISTS") return "exists";
    if (err.errorCode === "VALIDATION_ERROR") return "validation";
    if (err.errorCode === "UPLOADS_NOT_CONFIGURED") return "uploadsOff";
    if (err.errorCode === "INVALID_IMAGE_URL") return "uploadFailed";
    return "generic";
  }
  throw err;
}

export async function createCategoryAction(formData: FormData): Promise<void> {
  await requireAdminPermission("services.manage");
  let created: AdminCategory;
  try {
    const imageUrl = await uploadCategoryImage(formData.get("image"));
    created = await adminApi<AdminCategory>("/admin/service-categories", {
      method: "POST",
      body: {
        type: text(formData, "type"),
        nameEn: text(formData, "nameEn"),
        nameAr: text(formData, "nameAr"),
        descriptionEn: text(formData, "descriptionEn") || null,
        descriptionAr: text(formData, "descriptionAr") || null,
        imageUrl,
        isActive: true,
      },
    });
  } catch (err) {
    redirect(`/admin/categories?error=${errorCode(err)}`);
  }
  revalidatePath("/admin/categories");
  redirect(`/admin/categories?created=${encodeURIComponent(created.id)}`);
}

export async function updateCategoryAction(categoryId: string, formData: FormData): Promise<void> {
  await requireAdminPermission("services.manage");
  try {
    const body: Record<string, unknown> = {
      nameEn: text(formData, "nameEn"),
      nameAr: text(formData, "nameAr"),
      descriptionEn: text(formData, "descriptionEn") || null,
      descriptionAr: text(formData, "descriptionAr") || null,
    };
    const imageUrl = await uploadCategoryImage(formData.get("image"));
    if (imageUrl) body.imageUrl = imageUrl;
    else if (formData.get("removeImage") === "on") body.imageUrl = null;
    await adminApi(`/admin/service-categories/${categoryId}`, { method: "PATCH", body });
  } catch (err) {
    redirect(`/admin/categories/${categoryId}?error=${errorCode(err)}`);
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
