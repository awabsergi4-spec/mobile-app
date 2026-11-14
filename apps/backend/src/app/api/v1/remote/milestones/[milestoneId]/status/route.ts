import { NextRequest } from "next/server";
import { updateRemoteMilestoneStatusSchema } from "@sahl/shared/schemas/remote.schema";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import {
  remoteEngagementRepository,
  remoteMilestoneRepository,
  updateRemoteMilestoneStatusUseCase,
} from "@/infrastructure/remote/remote-services";
import { providerProfileRepository } from "@/infrastructure/provider/provider-services";
import { requireRemoteEngagementParty, NotRemoteEngagementPartyError } from "@/presentation/remote-guards";
import {
  InvalidRemoteMilestoneStatusTransitionError,
  RemoteEngagementNotFoundError,
  RemoteMilestoneNotFoundError,
} from "@/application/remote/errors";
import { ok, fail } from "@/presentation/http-response";

// PAID is deliberately not reachable here — same reasoning as
// contracts/milestones/[milestoneId]/status/route.ts, see
// admin/remote/milestones/[milestoneId]/mark-paid.
const PARTY_ALLOWED_TO_STATUS: Record<"customer" | "provider", string[]> = {
  provider: ["IN_PROGRESS", "SUBMITTED"],
  customer: ["APPROVED"],
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ milestoneId: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { milestoneId } = await params;

    const milestone = await remoteMilestoneRepository.findById(milestoneId);
    if (!milestone) {
      return fail("REMOTE_MILESTONE_NOT_FOUND", "Remote milestone not found", { status: 404 });
    }
    const engagement = await remoteEngagementRepository.findById(milestone.engagementId);
    if (!engagement) {
      return fail("REMOTE_ENGAGEMENT_NOT_FOUND", "Remote engagement not found", { status: 404 });
    }
    const party = await requireRemoteEngagementParty(engagement, userId, providerProfileRepository);

    const body = await req.json();
    const parsed = updateRemoteMilestoneStatusSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    if (!PARTY_ALLOWED_TO_STATUS[party].includes(parsed.data.toStatus)) {
      return fail("FORBIDDEN", `A ${party} cannot move a milestone to ${parsed.data.toStatus}`, { status: 403 });
    }

    const updated = await updateRemoteMilestoneStatusUseCase.execute({ milestoneId, toStatus: parsed.data.toStatus });
    return ok(updated);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof NotRemoteEngagementPartyError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    if (err instanceof RemoteMilestoneNotFoundError) {
      return fail("REMOTE_MILESTONE_NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof RemoteEngagementNotFoundError) {
      return fail("REMOTE_ENGAGEMENT_NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof InvalidRemoteMilestoneStatusTransitionError) {
      return fail("INVALID_STATUS_TRANSITION", err.message, { status: 409 });
    }
    throw err;
  }
}
