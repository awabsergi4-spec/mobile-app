"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/presentation/admin-session";
import { resolveDisputeUseCase, disputeRepository } from "@/infrastructure/dispute/dispute-services";
import { escrowRepository } from "@/infrastructure/finance/finance-services";
import { resolvePayoutTarget } from "@/presentation/resolve-payout-target";
import { DisputeNotFoundError } from "@/application/dispute/errors";
import type { DisputeResolutionDecision } from "@/application/dispute/resolve-dispute.use-case";

import { getI18n } from "@/presentation/i18n";
// Never accepts providerWalletId/commissionPercentage from the form — same
// rule as the REST endpoint (Financial Core Phase 17): both are always
// derived server-side via resolvePayoutTarget.
export async function resolveDisputeAction(disputeId: string, formData: FormData): Promise<void> {
  const { t } = await getI18n();
  const { userId: actorId } = await requireAdminPermission("finance.manage");

  const decision = String(formData.get("decision") ?? "");
  const resolutionNotes = String(formData.get("resolutionNotes") ?? "").trim();
  const gatewayProvider = String(formData.get("gatewayProvider") ?? "mock").trim() || "mock";
  if (resolutionNotes.length < 3) {
    throw new Error(t("ui.resolutionNotesAtLeast3CharactersAre"));
  }

  const dispute = await disputeRepository.findById(disputeId);
  if (!dispute) {
    throw new DisputeNotFoundError();
  }

  let resolution: DisputeResolutionDecision;
  if (decision === "REFUND_CUSTOMER") {
    resolution = { decision: "REFUND_CUSTOMER", gatewayProvider };
  } else {
    const escrow = await escrowRepository.findByRelatedEntity(dispute.relatedEntityType, dispute.relatedEntityId);
    if (!escrow) {
      throw new Error(t("ui.noEscrowIsAssociatedWithThisDispute"));
    }
    const { providerWalletId, commissionPercentage } = await resolvePayoutTarget(
      dispute.relatedEntityType,
      dispute.relatedEntityId,
      escrow.amount,
      escrow.currency,
    );

    if (decision === "RELEASE_TO_PROVIDER") {
      resolution = { decision: "RELEASE_TO_PROVIDER", providerWalletId, commissionPercentage, gatewayProvider };
    } else if (decision === "PARTIAL_SPLIT") {
      const providerAmount = Number(formData.get("providerAmount"));
      const refundAmount = Number(formData.get("refundAmount"));
      if (!Number.isFinite(providerAmount) || !Number.isFinite(refundAmount) || providerAmount <= 0 || refundAmount <= 0) {
        throw new Error(t("ui.providerAmountAndRefundAmountMustBoth"));
      }
      resolution = { decision: "PARTIAL_SPLIT", providerAmount, refundAmount, providerWalletId, commissionPercentage, gatewayProvider };
    } else {
      throw new Error(t("ui.invalidResolutionDecision"));
    }
  }

  await resolveDisputeUseCase.execute({ disputeId, resolvedById: actorId, resolutionNotes, resolution });
  revalidatePath(`/admin/finance/disputes/${disputeId}`);
}
