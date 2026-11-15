"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/presentation/admin-session";
import {
  suspendCompanyUseCase,
  reactivateCompanyUseCase,
  deleteCompanyUseCase,
  reviewCompanyVerificationUseCase,
} from "@/infrastructure/company/company-services";

import { getI18n } from "@/presentation/i18n";
export async function suspendCompanyAction(companyId: string, formData: FormData): Promise<void> {
  const { t } = await getI18n();
  const { userId: actorId } = await requireAdminPermission("companies.manage");
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 3) {
    throw new Error(t("ui.aReasonOfAtLeast3Characters"));
  }
  await suspendCompanyUseCase.execute({ companyId, reason, actorId });
  revalidatePath(`/admin/companies/${companyId}`);
}

export async function reactivateCompanyAction(companyId: string): Promise<void> {
  const { userId: actorId } = await requireAdminPermission("companies.manage");
  await reactivateCompanyUseCase.execute({ companyId, actorId });
  revalidatePath(`/admin/companies/${companyId}`);
}

export async function deleteCompanyAction(companyId: string): Promise<void> {
  const { userId: actorId } = await requireAdminPermission("companies.manage");
  await deleteCompanyUseCase.execute({ companyId, actorId });
  revalidatePath(`/admin/companies/${companyId}`);
}

export async function reviewCompanyVerificationAction(companyId: string, formData: FormData): Promise<void> {
  const { t } = await getI18n();
  const { userId: actorId } = await requireAdminPermission("companies.manage");
  const decision = String(formData.get("decision") ?? "");
  if (decision !== "VERIFIED" && decision !== "REJECTED" && decision !== "NEEDS_MORE_INFO") {
    throw new Error(t("ui.invalidVerificationDecision"));
  }
  const reason = String(formData.get("reason") ?? "").trim() || undefined;
  await reviewCompanyVerificationUseCase.execute({ companyId, decision, reason, actorId });
  revalidatePath(`/admin/companies/${companyId}`);
}
