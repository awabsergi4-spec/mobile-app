import { NextRequest } from "next/server";
import { openDisputeSchema } from "@sahl/shared/schemas/finance.schema";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { disputeRepository, openDisputeUseCase } from "@/infrastructure/dispute/dispute-services";
import { contractMilestoneRepository, contractProjectRepository, contractRepository } from "@/infrastructure/contract/contract-services";
import { remoteEngagementRepository, remoteMilestoneRepository } from "@/infrastructure/remote/remote-services";
import { providerProfileRepository } from "@/infrastructure/provider/provider-services";
import { requireContractParty, NotContractPartyError } from "@/presentation/contract-guards";
import { requireRemoteEngagementParty, NotRemoteEngagementPartyError } from "@/presentation/remote-guards";
import { ok, fail } from "@/presentation/http-response";

// Self-service dispute opening is only wired for the two entity types that
// have real Financial Core escrow integration (Contract/Remote
// milestones) — ownership is verified against the actual party records,
// not trusted from the request body. Other RelatedEntityType values are
// not reachable here yet (same honest scoping as On-Demand's payment
// integration gap); open those through the admin-only path instead.
async function assertCanOpenDispute(relatedEntityType: string, relatedEntityId: string, userId: string): Promise<void> {
  if (relatedEntityType === "CONTRACT_MILESTONE") {
    const milestone = await contractMilestoneRepository.findById(relatedEntityId);
    if (!milestone) {
      throw new NotFoundForDisputeError("Contract milestone not found");
    }
    const contract = await contractRepository.findById(milestone.contractId);
    if (!contract) {
      throw new NotFoundForDisputeError("Contract not found");
    }
    const project = await contractProjectRepository.findById(contract.projectId);
    if (!project) {
      throw new NotFoundForDisputeError("Contract project not found");
    }
    await requireContractParty(contract, project, userId, providerProfileRepository);
    return;
  }

  if (relatedEntityType === "REMOTE_MILESTONE") {
    const milestone = await remoteMilestoneRepository.findById(relatedEntityId);
    if (!milestone) {
      throw new NotFoundForDisputeError("Remote milestone not found");
    }
    const engagement = await remoteEngagementRepository.findById(milestone.engagementId);
    if (!engagement) {
      throw new NotFoundForDisputeError("Remote engagement not found");
    }
    await requireRemoteEngagementParty(engagement, userId, providerProfileRepository);
    return;
  }

  throw new UnsupportedDisputeEntityError(relatedEntityType);
}

class NotFoundForDisputeError extends Error {}
class UnsupportedDisputeEntityError extends Error {
  constructor(relatedEntityType: string) {
    super(`Self-service dispute opening is not supported for ${relatedEntityType}`);
  }
}

// The caller's own disputes — what Flutter's "My Disputes" list needs.
export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req, tokenService);

    const disputes = await disputeRepository.listByRaisedById(userId);
    return ok(disputes);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req, tokenService);

    const body = await req.json();
    const parsed = openDisputeSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    await assertCanOpenDispute(parsed.data.relatedEntityType, parsed.data.relatedEntityId, userId);

    const dispute = await openDisputeUseCase.execute({
      raisedById: userId,
      relatedEntityType: parsed.data.relatedEntityType,
      relatedEntityId: parsed.data.relatedEntityId,
      reason: parsed.data.reason,
    });

    return ok(dispute, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof NotContractPartyError || err instanceof NotRemoteEngagementPartyError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    if (err instanceof NotFoundForDisputeError) {
      return fail("NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof UnsupportedDisputeEntityError) {
      return fail("UNSUPPORTED_DISPUTE_ENTITY", err.message, { status: 400 });
    }
    throw err;
  }
}
