import { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { completeRemoteEngagementUseCase, remoteEngagementRepository } from "@/infrastructure/remote/remote-services";
import {
  InvalidRemoteEngagementStatusTransitionError,
  RemoteEngagementHasUnpaidMilestonesError,
  RemoteEngagementNotFoundError,
} from "@/application/remote/errors";
import { ok, fail } from "@/presentation/http-response";

// Customer-only: they're the one accepting the delivered work.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { id } = await params;

    const engagement = await remoteEngagementRepository.findById(id);
    if (!engagement) {
      return fail("REMOTE_ENGAGEMENT_NOT_FOUND", "Remote engagement not found", { status: 404 });
    }
    if (engagement.customerId !== userId) {
      return fail("FORBIDDEN", "Only the requesting customer can complete this engagement", { status: 403 });
    }

    const updated = await completeRemoteEngagementUseCase.execute({ engagementId: id });
    return ok(updated);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof RemoteEngagementNotFoundError) {
      return fail("REMOTE_ENGAGEMENT_NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof InvalidRemoteEngagementStatusTransitionError) {
      return fail("INVALID_STATUS_TRANSITION", err.message, { status: 409 });
    }
    if (err instanceof RemoteEngagementHasUnpaidMilestonesError) {
      return fail("UNPAID_MILESTONES", err.message, { status: 409 });
    }
    throw err;
  }
}
