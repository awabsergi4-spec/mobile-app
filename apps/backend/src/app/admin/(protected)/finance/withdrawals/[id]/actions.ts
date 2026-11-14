"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/presentation/admin-session";
import {
  approveWithdrawalUseCase,
  rejectWithdrawalUseCase,
  markWithdrawalPaidUseCase,
  markWithdrawalFailedUseCase,
} from "@/infrastructure/finance/finance-services";

export async function approveWithdrawalAction(withdrawalId: string): Promise<void> {
  const { userId: actorId } = await requireAdminPermission("finance.manage");
  await approveWithdrawalUseCase.execute({ withdrawalId, approvedById: actorId });
  revalidatePath(`/admin/finance/withdrawals/${withdrawalId}`);
}

export async function rejectWithdrawalAction(withdrawalId: string, formData: FormData): Promise<void> {
  const { userId: actorId } = await requireAdminPermission("finance.manage");
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 3) {
    throw new Error("A reason of at least 3 characters is required.");
  }
  await rejectWithdrawalUseCase.execute({ withdrawalId, rejectedById: actorId, reason });
  revalidatePath(`/admin/finance/withdrawals/${withdrawalId}`);
}

export async function markWithdrawalPaidAction(withdrawalId: string, formData: FormData): Promise<void> {
  await requireAdminPermission("finance.manage");
  const gatewayProvider = String(formData.get("gatewayProvider") ?? "").trim();
  const gatewayRef = String(formData.get("gatewayRef") ?? "").trim() || undefined;
  if (gatewayProvider.length < 1) {
    throw new Error("Gateway provider is required.");
  }
  // Deterministic key — a retried/double-clicked mark-paid for the same
  // withdrawal must land on the same PaymentTransaction, not a new one.
  await markWithdrawalPaidUseCase.execute({
    withdrawalId,
    gatewayProvider,
    gatewayRef,
    idempotencyKey: `withdrawal-paid:${withdrawalId}`,
  });
  revalidatePath(`/admin/finance/withdrawals/${withdrawalId}`);
}

export async function markWithdrawalFailedAction(withdrawalId: string, formData: FormData): Promise<void> {
  await requireAdminPermission("finance.manage");
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 3) {
    throw new Error("A reason of at least 3 characters is required.");
  }
  await markWithdrawalFailedUseCase.execute({ withdrawalId, reason });
  revalidatePath(`/admin/finance/withdrawals/${withdrawalId}`);
}
