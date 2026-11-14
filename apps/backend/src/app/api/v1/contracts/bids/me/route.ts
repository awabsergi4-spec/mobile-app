import { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { contractBidRepository } from "@/infrastructure/contract/contract-services";
import { providerProfileRepository } from "@/infrastructure/provider/provider-services";
import { ok, fail } from "@/presentation/http-response";
import type { BidStatus } from "@prisma/client";

// The signed-in provider's own submitted bids — what Flutter's "My Bids"
// list needs (see the comment on the project-bids route explaining why
// providers can't see the full per-project bid list).
export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req, tokenService);

    const providerProfile = await providerProfileRepository.findByUserId(userId);
    if (!providerProfile) {
      return fail("PROVIDER_PROFILE_NOT_FOUND", "No provider profile for this account", { status: 404 });
    }

    const status = req.nextUrl.searchParams.get("status") as BidStatus | null;

    const bids = await contractBidRepository.listByProviderId(providerProfile.id, { status: status ?? undefined });
    return ok(bids);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    throw err;
  }
}
