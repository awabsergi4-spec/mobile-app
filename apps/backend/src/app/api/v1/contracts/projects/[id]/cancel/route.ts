import { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { cancelContractProjectUseCase, contractProjectRepository } from "@/infrastructure/contract/contract-services";
import { ContractProjectNotFoundError, ContractProjectNotOpenError } from "@/application/contract/errors";
import { ok, fail } from "@/presentation/http-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { id } = await params;

    const project = await contractProjectRepository.findById(id);
    if (!project) {
      return fail("CONTRACT_PROJECT_NOT_FOUND", "Contract project not found", { status: 404 });
    }
    if (project.customerId !== userId) {
      return fail("FORBIDDEN", "Only the posting customer can cancel this project", { status: 403 });
    }

    await cancelContractProjectUseCase.execute({ projectId: id });
    return ok({ status: "CANCELLED" });
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
    throw err;
  }
}
