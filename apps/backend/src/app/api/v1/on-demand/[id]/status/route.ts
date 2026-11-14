import { NextRequest } from "next/server";
import { updateOnDemandStatusSchema } from "@sahl/shared/schemas/on-demand.schema";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { onDemandAssignmentRepository, updateOnDemandStatusUseCase } from "@/infrastructure/on-demand/on-demand-services";
import { providerProfileRepository } from "@/infrastructure/provider/provider-services";
import { InvalidOnDemandStatusTransitionError, OnDemandRequestNotFoundError } from "@/application/on-demand/errors";
import { ok, fail } from "@/presentation/http-response";

// Only the provider holding the ACCEPTED assignment may drive the
// request through EN_ROUTE/IN_PROGRESS/COMPLETED — the customer and any
// declined/expired offer-holder have no standing here.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { id } = await params;

    const providerProfile = await providerProfileRepository.findByUserId(userId);
    if (!providerProfile) {
      return fail("FORBIDDEN", "Only an assigned provider can update this request's status", { status: 403 });
    }

    const assignments = await onDemandAssignmentRepository.listByRequestId(id);
    const acceptedAssignment = assignments.find((a) => a.status === "ACCEPTED" && a.providerId === providerProfile.id);
    if (!acceptedAssignment) {
      return fail("FORBIDDEN", "Only the accepted provider can update this request's status", { status: 403 });
    }

    const body = await req.json();
    const parsed = updateOnDemandStatusSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    const request = await updateOnDemandStatusUseCase.execute({ requestId: id, toStatus: parsed.data.toStatus });
    return ok(request);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof OnDemandRequestNotFoundError) {
      return fail("ON_DEMAND_REQUEST_NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof InvalidOnDemandStatusTransitionError) {
      return fail("INVALID_STATUS_TRANSITION", err.message, { status: 409 });
    }
    throw err;
  }
}
