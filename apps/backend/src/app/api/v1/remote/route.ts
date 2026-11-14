import { NextRequest } from "next/server";
import { createRemoteEngagementSchema } from "@sahl/shared/schemas/remote.schema";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { createRemoteEngagementUseCase, remoteEngagementRepository } from "@/infrastructure/remote/remote-services";
import { providerProfileRepository } from "@/infrastructure/provider/provider-services";
import { ProviderNotEligibleError } from "@/application/remote/errors";
import { ok, fail } from "@/presentation/http-response";

// The caller's own engagements — `role=provider` for a provider's booked
// work, otherwise the customer's own hires. Remote has no open-marketplace
// browse (the customer picks a specific provider up front), so unlike
// On-Demand/Contract there's no "mine=false" branch here.
export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req, tokenService);

    const role = req.nextUrl.searchParams.get("role");

    if (role === "provider") {
      const providerProfile = await providerProfileRepository.findByUserId(userId);
      if (!providerProfile) {
        return fail("PROVIDER_PROFILE_NOT_FOUND", "No provider profile for this account", { status: 404 });
      }
      const engagements = await remoteEngagementRepository.listByProviderId(providerProfile.id, {});
      return ok(engagements);
    }

    const engagements = await remoteEngagementRepository.listByCustomerId(userId, {});
    return ok(engagements);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req, tokenService);

    const body = await req.json();
    const parsed = createRemoteEngagementSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    const engagement = await createRemoteEngagementUseCase.execute({ customerId: userId, ...parsed.data });
    return ok(engagement, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof ProviderNotEligibleError) {
      return fail("PROVIDER_NOT_ELIGIBLE", err.message, { status: 422 });
    }
    throw err;
  }
}
