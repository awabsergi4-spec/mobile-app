import { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { withdrawContractBidUseCase } from "@/infrastructure/contract/contract-services";
import { providerProfileRepository } from "@/infrastructure/provider/provider-services";
import { ContractBidNotFoundError, ContractBidNotSubmittedError, NotBidOwnerError } from "@/application/contract/errors";
import { ok, fail } from "@/presentation/http-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ bidId: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { bidId } = await params;

    const providerProfile = await providerProfileRepository.findByUserId(userId);
    if (!providerProfile) {
      return fail("PROVIDER_PROFILE_NOT_FOUND", "No provider profile for this account", { status: 404 });
    }

    await withdrawContractBidUseCase.execute({ bidId, providerId: providerProfile.id });
    return ok({ status: "WITHDRAWN" });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof ContractBidNotFoundError) {
      return fail("CONTRACT_BID_NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof NotBidOwnerError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    if (err instanceof ContractBidNotSubmittedError) {
      return fail("CONTRACT_BID_NOT_SUBMITTED", err.message, { status: 409 });
    }
    throw err;
  }
}
