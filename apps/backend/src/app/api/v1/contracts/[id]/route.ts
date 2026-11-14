import { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { contractProjectRepository, contractRepository } from "@/infrastructure/contract/contract-services";
import { providerProfileRepository } from "@/infrastructure/provider/provider-services";
import { requireContractParty, NotContractPartyError } from "@/presentation/contract-guards";
import { ok, fail } from "@/presentation/http-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    return ok(contract);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof NotContractPartyError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    throw err;
  }
}
