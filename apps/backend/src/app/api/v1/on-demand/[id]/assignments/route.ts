import { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { onDemandAssignmentRepository, onDemandRequestRepository } from "@/infrastructure/on-demand/on-demand-services";
import { providerProfileRepository } from "@/infrastructure/provider/provider-services";
import { requireOnDemandRequestParty, NotRequestPartyError } from "@/presentation/on-demand-guards";
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

    const assignments = await onDemandAssignmentRepository.listByRequestId(id);
    return ok(assignments);
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
