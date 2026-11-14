import { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { awardContractBidUseCase, contractBidRepository, contractProjectRepository } from "@/infrastructure/contract/contract-services";
import {
  ContractBidNotFoundError,
  ContractBidNotSubmittedError,
  ContractProjectNotOpenError,
  ProviderNotEligibleError,
} from "@/application/contract/errors";
import { ok, fail } from "@/presentation/http-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ bidId: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { bidId } = await params;

    const bid = await contractBidRepository.findById(bidId);
    if (!bid) {
      return fail("CONTRACT_BID_NOT_FOUND", "Contract bid not found", { status: 404 });
    }
    const project = await contractProjectRepository.findById(bid.projectId);
    if (!project || project.customerId !== userId) {
      return fail("FORBIDDEN", "Only the posting customer can award this bid", { status: 403 });
    }

    const contract = await awardContractBidUseCase.execute({ bidId });
    return ok(contract, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof ContractBidNotFoundError) {
      return fail("CONTRACT_BID_NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof ContractBidNotSubmittedError) {
      return fail("CONTRACT_BID_NOT_SUBMITTED", err.message, { status: 409 });
    }
    if (err instanceof ContractProjectNotOpenError) {
      return fail("CONTRACT_PROJECT_NOT_OPEN", err.message, { status: 409 });
    }
    if (err instanceof ProviderNotEligibleError) {
      return fail("PROVIDER_NOT_ELIGIBLE", err.message, { status: 409 });
    }
    throw err;
  }
}
