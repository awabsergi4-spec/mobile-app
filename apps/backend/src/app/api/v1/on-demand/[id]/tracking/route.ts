import { NextRequest } from "next/server";
import { recordTrackingPingSchema } from "@sahl/shared/schemas/on-demand.schema";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import {
  onDemandAssignmentRepository,
  onDemandRequestRepository,
  onDemandTrackingRepository,
  recordTrackingPingUseCase,
} from "@/infrastructure/on-demand/on-demand-services";
import { providerProfileRepository } from "@/infrastructure/provider/provider-services";
import { requireOnDemandRequestParty, NotRequestPartyError } from "@/presentation/on-demand-guards";
import { InvalidOnDemandStatusTransitionError, OnDemandRequestNotFoundError } from "@/application/on-demand/errors";
import { ok, fail } from "@/presentation/http-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { id } = await params;

    const request = await onDemandRequestRepository.findById(id);
    if (!request) {
      return fail("ON_DEMAND_REQUEST_NOT_FOUND", "On-demand request not found", { status: 404 });
    }
    await requireOnDemandRequestParty(request, userId, providerProfileRepository, onDemandAssignmentRepository);

    const pings = await onDemandTrackingRepository.listByRequestId(id);
    return ok(pings);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof NotRequestPartyError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    throw err;
  }
}

// Only the accepted provider pushes location pings — same authorization
// as the status-transition route.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { id } = await params;

    const providerProfile = await providerProfileRepository.findByUserId(userId);
    if (!providerProfile) {
      return fail("FORBIDDEN", "Only an assigned provider can record tracking pings", { status: 403 });
    }

    const assignments = await onDemandAssignmentRepository.listByRequestId(id);
    const acceptedAssignment = assignments.find((a) => a.status === "ACCEPTED" && a.providerId === providerProfile.id);
    if (!acceptedAssignment) {
      return fail("FORBIDDEN", "Only the accepted provider can record tracking pings", { status: 403 });
    }

    const body = await req.json();
    const parsed = recordTrackingPingSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    const ping = await recordTrackingPingUseCase.execute({ requestId: id, ...parsed.data });
    return ok(ping, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof OnDemandRequestNotFoundError) {
      return fail("ON_DEMAND_REQUEST_NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof InvalidOnDemandStatusTransitionError) {
      return fail("REQUEST_NOT_TRACKABLE", err.message, { status: 409 });
    }
    throw err;
  }
}
