import { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { completeContractUseCase, contractProjectRepository, contractRepository } from "@/infrastructure/contract/contract-services";
import { ContractHasUnpaidMilestonesError, ContractNotFoundError, InvalidContractStatusTransitionError } from "@/application/contract/errors";
import { ok, fail } from "@/presentation/http-response";

// Customer-only: they're the paying party confirming satisfaction, same
// authorization shape as project cancellation.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { id } = await params;

    const contract = await contractRepository.findById(id);
    if (!contract) {
      return fail("CONTRACT_NOT_FOUND", "Contract not found", { status: 404 });
    }
    const project = await contractProjectRepository.findById(contract.projectId);
    if (!project || project.customerId !== userId) {
      return fail("FORBIDDEN", "Only the posting customer can complete this contract", { status: 403 });
    }

    const updated = await completeContractUseCase.execute({ contractId: id });
    return ok(updated);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof ContractNotFoundError) {
      return fail("CONTRACT_NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof InvalidContractStatusTransitionError) {
      return fail("INVALID_STATUS_TRANSITION", err.message, { status: 409 });
    }
    if (err instanceof ContractHasUnpaidMilestonesError) {
      return fail("UNPAID_MILESTONES", err.message, { status: 409 });
    }
    throw err;
  }
}
