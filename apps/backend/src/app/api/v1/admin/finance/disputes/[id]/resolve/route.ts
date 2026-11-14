import { NextRequest } from "next/server";
import { resolveDisputeSchema } from "@sahl/shared/schemas/finance.schema";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { resolveDisputeUseCase, disputeRepository } from "@/infrastructure/dispute/dispute-services";
import type { DisputeResolutionDecision } from "@/application/dispute/resolve-dispute.use-case";
import { escrowRepository } from "@/infrastructure/finance/finance-services";
import { DisputeNotFoundError, DisputeNotOpenError, InvalidDisputeSplitError } from "@/application/dispute/errors";
import {
  EscrowDisputedError,
  EscrowNotFoundError,
  EscrowNotHeldError,
  EscrowReleaseConflictError,
  InsufficientWalletBalanceError,
  InvalidEscrowRefundAmountError,
  InvalidReleaseAmountError,
} from "@/application/finance/errors";
import { resolvePayoutTarget, UnresolvablePayoutTargetError } from "@/presentation/resolve-payout-target";
import { ok, fail } from "@/presentation/http-response";

// Admin-only: the sole path allowed to move money out of a DISPUTED
// escrow (Financial Core Phase 10) — release/refund/partial-split, never
// a normal service-completion flow.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requirePermission(req, "finance.manage", tokenService, staffPermissionRepository);
    const { id } = await params;

    const body = await req.json();
    const parsed = resolveDisputeSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    const dispute = await disputeRepository.findById(id);
    if (!dispute) {
      return fail("NOT_FOUND", "Dispute not found", { status: 404 });
    }

    let resolution: DisputeResolutionDecision;
    if (parsed.data.resolution.decision === "REFUND_CUSTOMER") {
      resolution = { decision: "REFUND_CUSTOMER", gatewayProvider: parsed.data.resolution.gatewayProvider };
    } else {
      const escrow = await escrowRepository.findByRelatedEntity(dispute.relatedEntityType, dispute.relatedEntityId);
      if (!escrow) {
        return fail("ESCROW_NOT_FOUND", "No escrow is associated with this dispute", { status: 404 });
      }
      const { providerWalletId, commissionPercentage } = await resolvePayoutTarget(
        dispute.relatedEntityType,
        dispute.relatedEntityId,
        escrow.amount,
        escrow.currency,
      );

      resolution =
        parsed.data.resolution.decision === "RELEASE_TO_PROVIDER"
          ? { decision: "RELEASE_TO_PROVIDER", providerWalletId, commissionPercentage, gatewayProvider: parsed.data.resolution.gatewayProvider }
          : {
              decision: "PARTIAL_SPLIT",
              providerAmount: parsed.data.resolution.providerAmount,
              refundAmount: parsed.data.resolution.refundAmount,
              providerWalletId,
              commissionPercentage,
              gatewayProvider: parsed.data.resolution.gatewayProvider,
            };
    }

    await resolveDisputeUseCase.execute({
      disputeId: id,
      resolvedById: userId,
      resolutionNotes: parsed.data.resolutionNotes,
      resolution,
    });

    return ok({ status: "RESOLVED" });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    if (err instanceof DisputeNotFoundError || err instanceof EscrowNotFoundError) {
      return fail("NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof UnresolvablePayoutTargetError) {
      return fail("UNRESOLVABLE_PAYOUT_TARGET", err.message, { status: 400 });
    }
    if (err instanceof DisputeNotOpenError) {
      return fail("DISPUTE_NOT_OPEN", err.message, { status: 409 });
    }
    if (err instanceof InvalidDisputeSplitError) {
      return fail("INVALID_DISPUTE_SPLIT", err.message, { status: 400 });
    }
    if (
      err instanceof EscrowNotHeldError ||
      err instanceof EscrowDisputedError ||
      err instanceof EscrowReleaseConflictError ||
      err instanceof InvalidReleaseAmountError ||
      err instanceof InvalidEscrowRefundAmountError
    ) {
      return fail("ESCROW_NOT_RESOLVABLE", err.message, { status: 409 });
    }
    if (err instanceof InsufficientWalletBalanceError) {
      return fail("INSUFFICIENT_BALANCE", err.message, { status: 409 });
    }
    throw err;
  }
}
