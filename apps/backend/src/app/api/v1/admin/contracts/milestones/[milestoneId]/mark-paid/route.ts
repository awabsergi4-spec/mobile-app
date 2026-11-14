import { NextRequest } from "next/server";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { releaseContractMilestonePaymentUseCase } from "@/infrastructure/contract/contract-services";
import { auditLogWriter } from "@/infrastructure/provider/provider-services";
import { ContractMilestoneNotFoundError, ContractNotFoundError, InvalidMilestoneStatusTransitionError } from "@/application/contract/errors";
import { EscrowNotFoundError, EscrowNotHeldError, EscrowReleaseConflictError } from "@/application/finance/errors";
import { ProviderProfileNotFoundError } from "@/application/provider/errors";
import { ok, fail } from "@/presentation/http-response";

// System/ops-only: releases the real escrow funded for this milestone —
// provider share credited to their wallet, platform commission recorded
// through the Financial Core (ADR-008) — then moves the milestone to
// PAID. In a full build this is triggered automatically by a
// RELEASE_ESCROW workflow action executor (ADR-009) reacting to
// ContractMilestoneApproved; exposed here as the manual admin trigger
// since that automatic dispatch isn't wired yet. No longer a bare status
// flip with no money behind it — see Financial Core Phase 9.
export async function POST(req: NextRequest, { params }: { params: Promise<{ milestoneId: string }> }) {
  try {
    const { userId } = await requirePermission(req, "contracts.manage", tokenService, staffPermissionRepository);
    const { milestoneId } = await params;

    const result = await releaseContractMilestonePaymentUseCase.execute({ milestoneId });

    // Money-adjacent admin action — recorded here (not inside the use
    // case itself, since the same release path is also reachable in a
    // full build from a system/workflow actor with no human actorId) so
    // there's a WHO/WHEN record of which staff member confirmed this
    // payout.
    await auditLogWriter.write({
      actorId: userId,
      action: "contract-milestone.mark-paid",
      entityType: "ContractMilestone",
      entityId: milestoneId,
      metadata: { providerAmount: result.providerAmount, commissionAmount: result.commissionAmount },
    });

    return ok(result);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    if (err instanceof ContractMilestoneNotFoundError) {
      return fail("CONTRACT_MILESTONE_NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof ContractNotFoundError) {
      return fail("CONTRACT_NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof ProviderProfileNotFoundError) {
      return fail("PROVIDER_PROFILE_NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof EscrowNotFoundError) {
      return fail("ESCROW_NOT_FOUND", "No escrow has been funded for this milestone yet", { status: 409 });
    }
    if (err instanceof EscrowNotHeldError || err instanceof EscrowReleaseConflictError) {
      return fail("ESCROW_NOT_RELEASABLE", err.message, { status: 409 });
    }
    if (err instanceof InvalidMilestoneStatusTransitionError) {
      return fail("INVALID_STATUS_TRANSITION", err.message, { status: 409 });
    }
    throw err;
  }
}
