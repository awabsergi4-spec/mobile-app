import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { fundRemoteMilestoneUseCase, remoteEngagementRepository, remoteMilestoneRepository } from "@/infrastructure/remote/remote-services";
import { prisma } from "@/infrastructure/prisma-client";
import { RemoteEngagementNotFoundError, RemoteMilestoneNotFoundError } from "@/application/remote/errors";
import { PaymentCaptureFailedError } from "@/application/finance/errors";
import { EscrowAlreadyFundedError } from "@/domain/finance/escrow-repository";
import { ok, fail } from "@/presentation/http-response";

// Customer-only — mirrors contracts/milestones/[milestoneId]/fund.
export async function POST(req: NextRequest, { params }: { params: Promise<{ milestoneId: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { milestoneId } = await params;

    const milestone = await remoteMilestoneRepository.findById(milestoneId);
    if (!milestone) {
      return fail("REMOTE_MILESTONE_NOT_FOUND", "Remote milestone not found", { status: 404 });
    }
    const engagement = await remoteEngagementRepository.findById(milestone.engagementId);
    if (!engagement || engagement.customerId !== userId) {
      return fail("FORBIDDEN", "Only the requesting customer can fund this milestone", { status: 403 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return fail("USER_NOT_FOUND", "User not found", { status: 404 });
    }
    const region = await prisma.region.findUnique({ where: { id: user.regionId } });
    if (!region) {
      return fail("REGION_NOT_FOUND", "Region not found for this account", { status: 500 });
    }

    const result = await fundRemoteMilestoneUseCase.execute({
      milestoneId,
      customerUserId: userId,
      regionId: region.id,
      currency: region.defaultCurrency,
      idempotencyKey: `remote-milestone-fund:${milestoneId}:${randomUUID()}`,
    });

    return ok(result, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof RemoteMilestoneNotFoundError) {
      return fail("REMOTE_MILESTONE_NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof RemoteEngagementNotFoundError) {
      return fail("REMOTE_ENGAGEMENT_NOT_FOUND", err.message, { status: 404 });
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
