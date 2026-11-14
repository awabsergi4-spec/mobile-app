import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { contractMilestoneRepository, contractProjectRepository, contractRepository, fundContractMilestoneUseCase } from "@/infrastructure/contract/contract-services";
import { prisma } from "@/infrastructure/prisma-client";
import { ContractMilestoneNotFoundError, ContractNotFoundError } from "@/application/contract/errors";
import { PaymentCaptureFailedError } from "@/application/finance/errors";
import { EscrowAlreadyFundedError } from "@/domain/finance/escrow-repository";
import { ok, fail } from "@/presentation/http-response";

// Customer-only: they're the party funding the milestone's escrow. Amount
// and currency are never taken from the client — both are read straight
// off the milestone/region records server-side (Financial Core Phase 17:
// never trust a client-supplied amount).
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
    if (!project || project.customerId !== userId) {
      return fail("FORBIDDEN", "Only the posting customer can fund this milestone", { status: 403 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return fail("USER_NOT_FOUND", "User not found", { status: 404 });
    }
    const region = await prisma.region.findUnique({ where: { id: user.regionId } });
    if (!region) {
      return fail("REGION_NOT_FOUND", "Region not found for this account", { status: 500 });
    }

    const result = await fundContractMilestoneUseCase.execute({
      milestoneId,
      customerUserId: userId,
      regionId: region.id,
      currency: region.defaultCurrency,
      idempotencyKey: `contract-milestone-fund:${milestoneId}:${randomUUID()}`,
    });

    return ok(result, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof ContractMilestoneNotFoundError) {
      return fail("CONTRACT_MILESTONE_NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof ContractNotFoundError) {
      return fail("CONTRACT_NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof PaymentCaptureFailedError) {
      return fail("PAYMENT_CAPTURE_FAILED", err.message, { status: 402 });
    }
    if (err instanceof EscrowAlreadyFundedError) {
      return fail("ESCROW_ALREADY_FUNDED", err.message, { status: 409 });
    }
    throw err;
  }
}
