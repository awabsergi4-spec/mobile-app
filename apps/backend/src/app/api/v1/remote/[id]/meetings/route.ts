import { NextRequest } from "next/server";
import { scheduleRemoteMeetingSchema } from "@sahl/shared/schemas/remote.schema";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import {
  remoteEngagementRepository,
  remoteMeetingRepository,
  scheduleRemoteMeetingUseCase,
} from "@/infrastructure/remote/remote-services";
import { providerProfileRepository } from "@/infrastructure/provider/provider-services";
import { requireRemoteEngagementParty, NotRemoteEngagementPartyError } from "@/presentation/remote-guards";
import { RemoteEngagementNotFoundError } from "@/application/remote/errors";
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

    const meetings = await remoteMeetingRepository.listByEngagementId(id);
    return ok(meetings);
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

// Either party may schedule — a meeting is a mutual convenience, not a
// unilateral action one side needs protecting from.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { id } = await params;

    const engagement = await remoteEngagementRepository.findById(id);
    if (!engagement) {
      return fail("REMOTE_ENGAGEMENT_NOT_FOUND", "Remote engagement not found", { status: 404 });
    }
    await requireRemoteEngagementParty(engagement, userId, providerProfileRepository);

    const body = await req.json();
    const parsed = scheduleRemoteMeetingSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    const meeting = await scheduleRemoteMeetingUseCase.execute({ engagementId: id, ...parsed.data });
    return ok(meeting, { status: 201 });
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
    throw err;
  }
}
