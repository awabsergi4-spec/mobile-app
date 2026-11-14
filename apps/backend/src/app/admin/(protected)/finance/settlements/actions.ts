"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/presentation/admin-session";
import { createSettlementUseCase, completeSettlementUseCase } from "@/infrastructure/finance/finance-services";
import type { SettlementSchedule } from "@prisma/client";

export async function createSettlementAction(formData: FormData): Promise<void> {
  await requireAdminPermission("finance.manage");
  const schedule = String(formData.get("schedule") ?? "MANUAL") as SettlementSchedule;
  const currency = String(formData.get("currency") ?? "").trim();
  if (currency.length !== 3) {
    throw new Error("A 3-letter currency code is required.");
  }
  await createSettlementUseCase.execute({ schedule, currency });
  revalidatePath("/admin/finance/settlements");
}

export async function completeSettlementAction(settlementId: string): Promise<void> {
  await requireAdminPermission("finance.manage");
  await completeSettlementUseCase.execute({ settlementId });
  revalidatePath("/admin/finance/settlements");
}
