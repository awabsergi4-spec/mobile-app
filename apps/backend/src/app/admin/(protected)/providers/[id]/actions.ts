"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/presentation/admin-session";
import {
  suspendProviderUseCase,
  reactivateProviderUseCase,
  deleteProviderUseCase,
  reviewProviderVerificationUseCase,
} from "@/infrastructure/provider/provider-services";

import { getI18n } from "@/presentation/i18n";
export async function suspendProviderAction(providerId: string, formData: FormData): Promise<void> {
  const { t } = await getI18n();
  const { userId: actorId } = await requireAdminPermission("providers.manage");
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 3) {
    throw new Error(t("ui.aReasonOfAtLeast3Characters"));
  }
  await suspendProviderUseCase.execute({ providerId, reason, actorId });
  revalidatePath(`/admin/providers/${providerId}`);
}

export async function reactivateProviderAction(providerId: string): Promise<void> {
  const { userId: actorId } = await requireAdminPermission("providers.manage");
  await reactivateProviderUseCase.execute({ providerId, actorId });
  revalidatePath(`/admin/providers/${providerId}`);
}

export async function deleteProviderAction(providerId: string): Promise<void> {
  const { userId: actorId } = await requireAdminPermission("providers.manage");
  await deleteProviderUseCase.execute({ providerId, actorId });
  revalidatePath(`/admin/providers/${providerId}`);
}

export async function reviewProviderVerificationAction(providerId: string, formData: FormData): Promise<void> {
  const { t } = await getI18n();
  const { userId: actorId } = await requireAdminPermission("providers.manage");
  const decision = String(formData.get("decision") ?? "");
  if (decision !== "VERIFIED" && decision !== "REJECTED" && decision !== "NEEDS_MORE_INFO") {
    throw new Error(t("ui.invalidVerificationDecision"));
  }
  const reason = String(formData.get("reason") ?? "").trim() || undefined;
  await reviewProviderVerificationUseCase.execute({ providerId, decision, reason, actorId });
  revalidatePath(`/admin/providers/${providerId}`);
}
