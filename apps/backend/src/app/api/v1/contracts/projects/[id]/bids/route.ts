import { NextRequest } from "next/server";
import { submitContractBidSchema } from "@sahl/shared/schemas/contract.schema";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { contractBidRepository, contractProjectRepository, submitContractBidUseCase } from "@/infrastructure/contract/contract-services";
import { providerProfileRepository } from "@/infrastructure/provider/provider-services";
import { ContractProjectNotFoundError, ContractProjectNotOpenError, ProviderNotEligibleError } from "@/application/contract/errors";
import { ok, fail } from "@/presentation/http-response";

// Only the project's own customer may see the full bid list — bidding
// providers use "my bids" surfaces elsewhere to track their own, not this
// route (avoids leaking competing bid amounts between providers).
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { id } = await params;

    const project = await contractProjectRepository.findById(id);
    if (!project) {
      return fail("CONTRACT_PROJECT_NOT_FOUND", "Contract project not found", { status: 404 });
    }
    if (project.customerId !== userId) {
      return fail("FORBIDDEN", "Only the posting customer can view all bids on this project", { status: 403 });
    }

    const bids = await contractBidRepository.listByProjectId(id);
    return ok(bids);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    throw err;
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { id } = await params;

    const providerProfile = await providerProfileRepository.findByUserId(userId);
    if (!providerProfile) {
      return fail("PROVIDER_PROFILE_NOT_FOUND", "No provider profile for this account", { status: 404 });
    }

    const body = await req.json();
    const parsed = submitContractBidSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    const bid = await submitContractBidUseCase.execute({ projectId: id, providerId: providerProfile.id, ...parsed.data });
    return ok(bid, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof ContractProjectNotFoundError) {
      return fail("CONTRACT_PROJECT_NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof ContractProjectNotOpenError) {
      return fail("CONTRACT_PROJECT_NOT_OPEN", err.message, { status: 409 });
    }
    if (err instanceof ProviderNotEligibleError) {
      return fail("PROVIDER_NOT_ELIGIBLE", err.message, { status: 403 });
    }
    throw err;
  }
}
