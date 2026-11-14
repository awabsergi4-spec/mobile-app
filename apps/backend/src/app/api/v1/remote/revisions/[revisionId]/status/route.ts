import { NextRequest } from "next/server";
import { updateRemoteRevisionStatusSchema } from "@sahl/shared/schemas/remote.schema";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import {
  remoteEngagementRepository,
  remoteRevisionRepository,
  updateRemoteRevisionStatusUseCase,
} from "@/infrastructure/remote/remote-services";
import { providerProfileRepository } from "@/infrastructure/provider/provider-services";
import { InvalidRemoteRevisionStatusTransitionError, RemoteRevisionNotFoundError } from "@/application/remote/errors";
import { ok, fail } from "@/presentation/http-response";

// Provider-only: they're the one addressing the requested revision.
export async function POST(req: NextRequest, { params }: { params: Promise<{ revisionId: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { revisionId } = await params;

    const revision = await remoteRevisionRepository.findById(revisionId);
    if (!revision) {
      return fail("REMOTE_REVISION_NOT_FOUND", "Remote revision not found", { status: 404 });
    }
    const engagement = await remoteEngagementRepository.findById(revision.engagementId);
    if (!engagement) {
      return fail("REMOTE_ENGAGEMENT_NOT_FOUND", "Remote engagement not found", { status: 404 });
    }
    const providerProfile = await providerProfileRepository.findByUserId(userId);
    if (!providerProfile || providerProfile.id !== engagement.providerId) {
      return fail("FORBIDDEN", "Only the engaged provider can update this revision's status", { status: 403 });
    }

    const body = await req.json();
    const parsed = updateRemoteRevisionStatusSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    const updated = await updateRemoteRevisionStatusUseCase.execute({ revisionId, toStatus: parsed.data.toStatus });
    return ok(updated);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof RemoteRevisionNotFoundError) {
      return fail("REMOTE_REVISION_NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof InvalidRemoteRevisionStatusTransitionError) {
      return fail("INVALID_STATUS_TRANSITION", err.message, { status: 409 });
    }
    throw err;
  }
}
