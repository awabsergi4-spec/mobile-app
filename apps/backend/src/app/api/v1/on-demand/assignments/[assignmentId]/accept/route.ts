import { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { acceptOnDemandAssignmentUseCase } from "@/infrastructure/on-demand/on-demand-services";
import { providerProfileRepository } from "@/infrastructure/provider/provider-services";
import {
  NotOfferedProviderError,
  OnDemandAssignmentNotFoundError,
  OnDemandAssignmentNotOfferedError,
} from "@/application/on-demand/errors";
import { ok, fail } from "@/presentation/http-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ assignmentId: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { assignmentId } = await params;

    const providerProfile = await providerProfileRepository.findByUserId(userId);
    if (!providerProfile) {
      return fail("PROVIDER_PROFILE_NOT_FOUND", "No provider profile for this account", { status: 404 });
    }

    await acceptOnDemandAssignmentUseCase.execute({ assignmentId, providerId: providerProfile.id });
    return ok({ status: "ACCEPTED" });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof OnDemandAssignmentNotFoundError) {
      return fail("ASSIGNMENT_NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof NotOfferedProviderError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    if (err instanceof OnDemandAssignmentNotOfferedError) {
      return fail("ASSIGNMENT_NOT_OFFERED", err.message, { status: 409 });
    }
    throw err;
  }
}
