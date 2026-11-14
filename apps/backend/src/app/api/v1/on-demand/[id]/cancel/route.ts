import { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { cancelOnDemandRequestUseCase, onDemandRequestRepository } from "@/infrastructure/on-demand/on-demand-services";
import { InvalidOnDemandStatusTransitionError, OnDemandRequestNotFoundError } from "@/application/on-demand/errors";
import { ok, fail } from "@/presentation/http-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { id } = await params;

    const request = await onDemandRequestRepository.findById(id);
    if (!request) {
      return fail("ON_DEMAND_REQUEST_NOT_FOUND", "On-demand request not found", { status: 404 });
    }
    if (request.customerId !== userId) {
      return fail("FORBIDDEN", "Only the requesting customer can cancel this request", { status: 403 });
    }

    await cancelOnDemandRequestUseCase.execute({ requestId: id, cancelledByUserId: userId });
    return ok({ status: "CANCELLED" });
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
