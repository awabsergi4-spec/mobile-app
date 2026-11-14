"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/presentation/admin-session";
import {
  createAdvertisementUseCase,
  updateAdvertisementUseCase,
  setAdvertisementActiveUseCase,
} from "@/infrastructure/advertisement/advertisement-services";
import type { AdPlacement, AdType } from "@prisma/client";

function readCommonFields(formData: FormData) {
  const startsAt = new Date(String(formData.get("startsAt")));
  const endsAt = new Date(String(formData.get("endsAt")));
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    throw new Error("End date must be after the start date.");
  }
  const title = String(formData.get("title") ?? "").trim();
  if (title.length < 1) {
    throw new Error("Title is required.");
  }

  return {
    adType: String(formData.get("adType")) as AdType,
    placement: String(formData.get("placement")) as AdPlacement,
    title,
    description: String(formData.get("description") ?? "").trim() || undefined,
    ctaText: String(formData.get("ctaText") ?? "").trim() || undefined,
    destinationUrl: String(formData.get("destinationUrl") ?? "").trim() || undefined,
    creativeUrl: String(formData.get("creativeUrl") ?? "").trim() || undefined,
    priority: Number(formData.get("priority") ?? 0) || 0,
    startsAt,
    endsAt,
  };
}

export async function createAdvertisementAction(formData: FormData): Promise<void> {
  const { userId: actorId } = await requireAdminPermission("advertisements.manage");
  const fields = readCommonFields(formData);
  const ad = await createAdvertisementUseCase.execute({ ...fields, actorId });
  revalidatePath("/admin/advertisements");
  redirect(`/admin/advertisements/${ad.id}`);
}

export async function updateAdvertisementAction(advertisementId: string, formData: FormData): Promise<void> {
  const { userId: actorId } = await requireAdminPermission("advertisements.manage");
  const fields = readCommonFields(formData);
  await updateAdvertisementUseCase.execute({ advertisementId, actorId, ...fields });
  revalidatePath(`/admin/advertisements/${advertisementId}`);
}

export async function setAdvertisementActiveAction(advertisementId: string, isActive: boolean): Promise<void> {
  const { userId: actorId } = await requireAdminPermission("advertisements.manage");
  await setAdvertisementActiveUseCase.execute({ advertisementId, isActive, actorId });
  revalidatePath(`/admin/advertisements/${advertisementId}`);
  revalidatePath("/admin/advertisements");
}
