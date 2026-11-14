import { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { deliverRemoteEngagementUseCase, remoteEngagementRepository } from "@/infrastructure/remote/remote-services";
import { providerProfileRepository } from "@/infrastructure/provider/provider-services";
import { InvalidRemoteEngagementStatusTransitionError, RemoteEngagementNotFoundError } from "@/application/remote/errors";
import { ok, fail } from "@/presentation/http-response";

// Provider-only: the provider is the one asserting the work is done.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { id } = await params;

    const engagement = await remoteEngagementRepository.findById(id);
    if (!engagement) {
      return fail("REMOTE_ENGAGEMENT_NOT_FOUND", "Remote engagement not found", { status: 404 });
    }
    const providerProfile = await providerProfileRepository.findByUserId(userId);
    if (!providerProfile || providerProfile.id !== engagement.providerId) {
      return fail("FORBIDDEN", "Only the engaged provider can mark this engagement delivered", { status: 403 });
    }

    const updated = await deliverRemoteEngagementUseCase.execute({ engagementId: id });
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
    throw err;
  }
}
