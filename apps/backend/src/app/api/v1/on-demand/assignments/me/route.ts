import { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { onDemandAssignmentRepository, onDemandRequestRepository } from "@/infrastructure/on-demand/on-demand-services";
import { providerProfileRepository } from "@/infrastructure/provider/provider-services";
import { ok, fail } from "@/presentation/http-response";
import type { AssignmentStatus } from "@prisma/client";

// The signed-in provider's own job offers/assignments — what the Flutter
// "incoming job offers" list needs.
export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req, tokenService);

    const providerProfile = await providerProfileRepository.findByUserId(userId);
    if (!providerProfile) {
      return fail("PROVIDER_PROFILE_NOT_FOUND", "No provider profile for this account", { status: 404 });
    }

    const status = req.nextUrl.searchParams.get("status") as AssignmentStatus | null;

    const assignments = await onDemandAssignmentRepository.listByProviderId(providerProfile.id, { status: status ?? undefined });

    // Enriched with the request's own description/category/emergency flag —
    // OnDemandAssignment only stores requestId, but a provider can't make an
    // informed accept/decline decision from an offer that doesn't say what
    // the job actually is.
    const enriched = await Promise.all(
      assignments.map(async (assignment) => {
        const request = await onDemandRequestRepository.findById(assignment.requestId);
        return {
          ...assignment,
          requestDescription: request?.description ?? null,
          requestCategoryId: request?.categoryId ?? null,
          requestIsEmergency: request?.isEmergency ?? false,
        };
      }),
    );

    return ok(enriched);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    throw err;
  }
}
