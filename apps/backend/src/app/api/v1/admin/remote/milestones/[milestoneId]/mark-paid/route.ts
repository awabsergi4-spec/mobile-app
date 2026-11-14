import { NextRequest } from "next/server";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { releaseRemoteMilestonePaymentUseCase } from "@/infrastructure/remote/remote-services";
import { auditLogWriter } from "@/infrastructure/provider/provider-services";
import { InvalidRemoteMilestoneStatusTransitionError, RemoteEngagementNotFoundError, RemoteMilestoneNotFoundError } from "@/application/remote/errors";
import { EscrowNotFoundError, EscrowNotHeldError, EscrowReleaseConflictError } from "@/application/finance/errors";
import { ProviderProfileNotFoundError } from "@/application/provider/errors";
import { ok, fail } from "@/presentation/http-response";

// System/ops-only — mirrors admin/contracts/milestones/[milestoneId]/mark-paid.
export async function POST(req: NextRequest, { params }: { params: Promise<{ milestoneId: string }> }) {
  try {
    const { userId } = await requirePermission(req, "remote.manage", tokenService, staffPermissionRepository);
    const { milestoneId } = await params;

    const result = await releaseRemoteMilestonePaymentUseCase.execute({ milestoneId });

    await auditLogWriter.write({
      actorId: userId,
      action: "remote-milestone.mark-paid",
      entityType: "RemoteMilestone",
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
    if (err instanceof RemoteMilestoneNotFoundError) {
      return fail("REMOTE_MILESTONE_NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof RemoteEngagementNotFoundError) {
      return fail("REMOTE_ENGAGEMENT_NOT_FOUND", err.message, { status: 404 });
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
    if (err instanceof InvalidRemoteMilestoneStatusTransitionError) {
      return fail("INVALID_STATUS_TRANSITION", err.message, { status: 409 });
    }
    throw err;
  }
}
