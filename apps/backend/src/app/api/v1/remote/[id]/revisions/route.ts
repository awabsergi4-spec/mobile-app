import { NextRequest } from "next/server";
import { requestRemoteRevisionSchema } from "@sahl/shared/schemas/remote.schema";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import {
  remoteEngagementRepository,
  remoteRevisionRepository,
  requestRemoteRevisionUseCase,
} from "@/infrastructure/remote/remote-services";
import { providerProfileRepository } from "@/infrastructure/provider/provider-services";
import { requireRemoteEngagementParty, NotRemoteEngagementPartyError } from "@/presentation/remote-guards";
import { InvalidRemoteEngagementStatusTransitionError, RemoteEngagementNotFoundError } from "@/application/remote/errors";
import { ok, fail } from "@/presentation/http-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { id } = await params;

    const engagement = await remoteEngagementRepository.findById(id);
    if (!engagement) {
      return fail("REMOTE_ENGAGEMENT_NOT_FOUND", "Remote engagement not found", { status: 404 });
    }
    await requireRemoteEngagementParty(engagement, userId, providerProfileRepository);

    const revisions = await remoteRevisionRepository.listByEngagementId(id);
    return ok(revisions);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof NotRemoteEngagementPartyError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    throw err;
  }
}

// Customer-only: only the paying party requests a revision.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { id } = await params;

    const engagement = await remoteEngagementRepository.findById(id);
    if (!engagement) {
      return fail("REMOTE_ENGAGEMENT_NOT_FOUND", "Remote engagement not found", { status: 404 });
    }
    if (engagement.customerId !== userId) {
      return fail("FORBIDDEN", "Only the requesting customer can request a revision", { status: 403 });
    }

    const body = await req.json();
    const parsed = requestRemoteRevisionSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    const revision = await requestRemoteRevisionUseCase.execute({ engagementId: id, requestedBy: userId, ...parsed.data });
    return ok(revision, { status: 201 });
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
