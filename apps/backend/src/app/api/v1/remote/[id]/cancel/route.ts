import { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { cancelRemoteEngagementUseCase, remoteEngagementRepository } from "@/infrastructure/remote/remote-services";
import { providerProfileRepository } from "@/infrastructure/provider/provider-services";
import { requireRemoteEngagementParty, NotRemoteEngagementPartyError } from "@/presentation/remote-guards";
import { InvalidRemoteEngagementStatusTransitionError, RemoteEngagementNotFoundError } from "@/application/remote/errors";
import { ok, fail } from "@/presentation/http-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { id } = await params;

    const engagement = await remoteEngagementRepository.findById(id);
    if (!engagement) {
      return fail("REMOTE_ENGAGEMENT_NOT_FOUND", "Remote engagement not found", { status: 404 });
    }
    await requireRemoteEngagementParty(engagement, userId, providerProfileRepository);

    await cancelRemoteEngagementUseCase.execute({ engagementId: id, cancelledByUserId: userId });
    return ok({ status: "CANCELLED" });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof NotRemoteEngagementPartyError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    if (err instanceof RemoteEngagementNotFoundError) {
      return fail("REMOTE_ENGAGEMENT_NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof InvalidRemoteEngagementStatusTransitionError) {
      return fail("INVALID_STATUS_TRANSITION", err.message, { status: 409 });
    }
    throw err;
  }
}
