import { NextRequest } from "next/server";
import { uploadContractDocumentSchema } from "@sahl/shared/schemas/contract.schema";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import {
  contractDocumentRepository,
  contractProjectRepository,
  contractRepository,
  uploadContractDocumentUseCase,
} from "@/infrastructure/contract/contract-services";
import { providerProfileRepository } from "@/infrastructure/provider/provider-services";
import { requireContractParty, NotContractPartyError } from "@/presentation/contract-guards";
import { ContractNotFoundError } from "@/application/contract/errors";
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

    const documents = await contractDocumentRepository.listByContractId(id);
    return ok(documents);
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

    const body = await req.json();
    const parsed = uploadContractDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    const document = await uploadContractDocumentUseCase.execute({ contractId: id, uploaderId: userId, ...parsed.data });
    return ok(document, { status: 201 });
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
    throw err;
  }
}
