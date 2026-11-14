import { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { cancelContractUseCase, contractProjectRepository, contractRepository } from "@/infrastructure/contract/contract-services";
import { providerProfileRepository } from "@/infrastructure/provider/provider-services";
import { requireContractParty, NotContractPartyError } from "@/presentation/contract-guards";
import { ContractNotFoundError, InvalidContractStatusTransitionError } from "@/application/contract/errors";
import { ok, fail } from "@/presentation/http-response";

// Either party can request cancellation — there's no dispute-resolution
// flow wired to Contracts yet, so this is the plain-cancel path; a real
// disagreement goes through Disputes once that module exists.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { id } = await params;

    const contract = await contractRepository.findById(id);
    if (!contract) {
      return fail("CONTRACT_NOT_FOUND", "Contract not found", { status: 404 });
    }
    const project = await contractProjectRepository.findById(contract.projectId);
    if (!project) {
      return fail("CONTRACT_PROJECT_NOT_FOUND", "Contract project not found", { status: 404 });
    }
    await requireContractParty(contract, project, userId, providerProfileRepository);

    await cancelContractUseCase.execute({ contractId: id, cancelledByUserId: userId });
    return ok({ status: "CANCELLED" });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof NotContractPartyError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    if (err instanceof ContractNotFoundError) {
      return fail("CONTRACT_NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof InvalidContractStatusTransitionError) {
      return fail("INVALID_STATUS_TRANSITION", err.message, { status: 409 });
    }
    throw err;
  }
}
