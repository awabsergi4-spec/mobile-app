import type { RemoteMilestoneRepository } from "@/domain/remote/remote-milestone.repository";
import type { RemoteEngagementRepository } from "@/domain/remote/remote-engagement.repository";
import type { EscrowRepository } from "@/domain/finance/escrow-repository";
import type { InitiatePaymentUseCase } from "@/application/finance/initiate-payment.use-case";
import type { CapturePaymentUseCase } from "@/application/finance/capture-payment.use-case";
import type { FundEscrowUseCase } from "@/application/finance/fund-escrow.use-case";
import { EscrowAlreadyFundedError } from "@/domain/finance/escrow-repository";
import { RemoteEngagementNotFoundError, RemoteMilestoneNotFoundError } from "./errors";

export interface FundRemoteMilestoneInput {
  milestoneId: string;
  customerUserId: string;
  regionId: string;
  currency: string;
  idempotencyKey: string;
}

// Mirrors application/contract/fund-contract-milestone.use-case.ts
// exactly — same Financial Core Phase 9 integration, same reasoning for
// why initiate+capture run together here.
export class FundRemoteMilestoneUseCase {
  constructor(
    private readonly milestones: RemoteMilestoneRepository,
    private readonly engagements: RemoteEngagementRepository,
    private readonly escrows: EscrowRepository,
    private readonly initiatePayment: InitiatePaymentUseCase,
    private readonly capturePayment: CapturePaymentUseCase,
    private readonly fundEscrow: FundEscrowUseCase,
  ) {}

  async execute(input: FundRemoteMilestoneInput): Promise<{ escrowId: string }> {
    const milestone = await this.milestones.findById(input.milestoneId);
    if (!milestone) {
      throw new RemoteMilestoneNotFoundError();
    }
    const engagement = await this.engagements.findById(milestone.engagementId);
    if (!engagement) {
      throw new RemoteEngagementNotFoundError();
    }

    // See FundContractMilestoneUseCase's identical check for why this
    // runs before any gateway call — same residual concurrent-race caveat
    // applies here too.
    const existingEscrow = await this.escrows.findByRelatedEntity("REMOTE_MILESTONE", milestone.id);
    if (existingEscrow) {
      throw new EscrowAlreadyFundedError();
    }

    const payment = await this.initiatePayment.execute({
      amount: milestone.amount,
      currency: input.currency,
      regionId: input.regionId,
      customerUserId: input.customerUserId,
      description: `Remote milestone: ${milestone.title}`,
      relatedEntityType: "REMOTE_MILESTONE",
      relatedEntityId: milestone.id,
      idempotencyKey: input.idempotencyKey,
    });

    await this.capturePayment.execute({
      transactionId: payment.transactionId,
      regionId: input.regionId,
      gatewayRef: payment.gatewayRef,
    });

    const { escrowId } = await this.fundEscrow.execute({
      amount: milestone.amount,
      currency: input.currency,
      relatedEntityType: "REMOTE_MILESTONE",
      relatedEntityId: milestone.id,
      gatewayProvider: "internal",
      gatewayRef: payment.gatewayRef,
      idempotencyKey: `${input.idempotencyKey}:fund`,
    });

    return { escrowId };
  }
}
