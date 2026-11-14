import { NextRequest } from "next/server";
import { updateContractMilestoneStatusSchema } from "@sahl/shared/schemas/contract.schema";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import {
  contractMilestoneRepository,
  contractProjectRepository,
  contractRepository,
  updateContractMilestoneStatusUseCase,
} from "@/infrastructure/contract/contract-services";
import { providerProfileRepository } from "@/infrastructure/provider/provider-services";
import { requireContractParty, NotContractPartyError } from "@/presentation/contract-guards";
import { ContractMilestoneNotFoundError, InvalidMilestoneStatusTransitionError } from "@/application/contract/errors";
import { ok, fail } from "@/presentation/http-response";

// PAID is deliberately not reachable here — it's system/workflow-driven
// (an admin/RELEASE_ESCROW action after money actually moves), see
// admin/contracts/milestones/[milestoneId]/mark-paid.
const PARTY_ALLOWED_TO_STATUS: Record<"customer" | "provider", string[]> = {
  provider: ["IN_PROGRESS", "SUBMITTED"],
  customer: ["APPROVED"],
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ milestoneId: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { milestoneId } = await params;

    const milestone = await contractMilestoneRepository.findById(milestoneId);
    if (!milestone) {
      return fail("CONTRACT_MILESTONE_NOT_FOUND", "Contract milestone not found", { status: 404 });
    }
    const contract = await contractRepository.findById(milestone.contractId);
    if (!contract) {
      return fail("CONTRACT_NOT_FOUND", "Contract not found", { status: 404 });
    }
    const project = await contractProjectRepository.findById(contract.projectId);
    if (!project) {
      return fail("CONTRACT_PROJECT_NOT_FOUND", "Contract project not found", { status: 404 });
    }
    const party = await requireContractParty(contract, project, userId, providerProfileRepository);

    const body = await req.json();
    const parsed = updateContractMilestoneStatusSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    if (!PARTY_ALLOWED_TO_STATUS[party].includes(parsed.data.toStatus)) {
      return fail("FORBIDDEN", `A ${party} cannot move a milestone to ${parsed.data.toStatus}`, { status: 403 });
    }

    const updated = await updateContractMilestoneStatusUseCase.execute({ milestoneId, toStatus: parsed.data.toStatus });
    return ok(updated);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof NotContractPartyError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    if (err instanceof ContractMilestoneNotFoundError) {
      return fail("CONTRACT_MILESTONE_NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof InvalidMilestoneStatusTransitionError) {
      return fail("INVALID_STATUS_TRANSITION", err.message, { status: 409 });
    }
    throw err;
  }
}
