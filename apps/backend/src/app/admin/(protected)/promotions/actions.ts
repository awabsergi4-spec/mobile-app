"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/presentation/admin-session";
import {
  createPromotionUseCase,
  updatePromotionUseCase,
  setPromotionActiveUseCase,
} from "@/infrastructure/promotion/promotion-services";
import type { DiscountType } from "@prisma/client";

import { getI18n, type Translate } from "@/presentation/i18n";

function readCommonFields(formData: FormData, t: Translate) {
  const startsAt = new Date(String(formData.get("startsAt")));
  const endsAt = new Date(String(formData.get("endsAt")));
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    throw new Error(t("ui.endDateMustBeAfterTheStart"));
  }
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 1) {
    throw new Error(t("ui.nameIsRequired"));
  }
  const discountValue = Number(formData.get("discountValue") ?? 0);
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    throw new Error(t("ui.discountValueMustBeAPositiveNumber"));
  }

  return {
    name,
    description: String(formData.get("description") ?? "").trim() || undefined,
    discountType: String(formData.get("discountType")) as DiscountType,
    discountValue,
    startsAt,
    endsAt,
  };
}

export async function createPromotionAction(formData: FormData): Promise<void> {
  const { userId: actorId } = await requireAdminPermission("promotions.manage");
  const fields = readCommonFields(formData, (await getI18n()).t);
  const promotion = await createPromotionUseCase.execute({ ...fields, actorId });
  revalidatePath("/admin/promotions");
  redirect(`/admin/promotions/${promotion.id}`);
}

export async function updatePromotionAction(promotionId: string, formData: FormData): Promise<void> {
  const { userId: actorId } = await requireAdminPermission("promotions.manage");
  const fields = readCommonFields(formData, (await getI18n()).t);
  await updatePromotionUseCase.execute({ promotionId, actorId, ...fields });
  revalidatePath(`/admin/promotions/${promotionId}`);
}

export async function setPromotionActiveAction(promotionId: string, isActive: boolean): Promise<void> {
  const { userId: actorId } = await requireAdminPermission("promotions.manage");
  await setPromotionActiveUseCase.execute({ promotionId, isActive, actorId });
  revalidatePath(`/admin/promotions/${promotionId}`);
  revalidatePath("/admin/promotions");
}
