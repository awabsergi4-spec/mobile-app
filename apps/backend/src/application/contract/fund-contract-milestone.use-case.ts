import type { ContractMilestoneRepository } from "@/domain/contract/contract-milestone.repository";
import type { ContractRepository } from "@/domain/contract/contract.repository";
import type { EscrowRepository } from "@/domain/finance/escrow-repository";
import type { InitiatePaymentUseCase } from "@/application/finance/initiate-payment.use-case";
import type { CapturePaymentUseCase } from "@/application/finance/capture-payment.use-case";
import type { FundEscrowUseCase } from "@/application/finance/fund-escrow.use-case";
import { EscrowAlreadyFundedError } from "@/domain/finance/escrow-repository";
import { ContractMilestoneNotFoundError, ContractNotFoundError } from "./errors";

export interface FundContractMilestoneInput {
  milestoneId: string;
  customerUserId: string;
  regionId: string;
  currency: string;
  idempotencyKey: string;
}

// The customer-facing "pay for this milestone" action — Financial Core
// Phase 9 service integration: replaces what would otherwise be an
// ad-hoc payment call inside the Contract module with three real,
// already-built Financial Core use cases run in sequence. Contract owns
// *when* funding happens (only a PENDING milestone can be funded); the
// money mechanics themselves stay entirely inside application/finance —
// this use case duplicates none of it.
//
// Real gateways would split initiate (redirect the customer for 3DS) and
// capture (webhook confirms) across two requests; running both here in
// one call is correct for MockPaymentProvider's synchronous AUTHORIZED
// response and is exactly what a hosted-checkout-free flow looks like —
// swapping in a real adapter later doesn't change this use case's shape.
export class FundContractMilestoneUseCase {
  constructor(
    private readonly milestones: ContractMilestoneRepository,
    private readonly contracts: ContractRepository,
    private readonly escrows: EscrowRepository,
    private readonly initiatePayment: InitiatePaymentUseCase,
    private readonly capturePayment: CapturePaymentUseCase,
    private readonly fundEscrow: FundEscrowUseCase,
  ) {}

  async execute(input: FundContractMilestoneInput): Promise<{ escrowId: string }> {
    const milestone = await this.milestones.findById(input.milestoneId);
    if (!milestone) {
      throw new ContractMilestoneNotFoundError();
    }
    const contract = await this.contracts.findById(milestone.contractId);
    if (!contract) {
      throw new ContractNotFoundError();
    }

    // The idempotencyKey passed in is per-call (includes a random
    // component), so it can't dedupe a customer re-submitting the fund
    // request after the first submission already completed — check for
    // an already-funded escrow up front instead, so a resubmitted request
    // doesn't authorize+capture a second real gateway charge before
    // FundEscrowUseCase's own unique-constraint guard would catch it.
    // This still leaves a narrow window on truly concurrent double-clicks
    // (both requests can pass this check before either creates the
    // escrow) — closing that fully needs a schema-level funding-attempt
    // claim, out of scope for this pass; flagged as a residual risk.
    const existingEscrow = await this.escrows.findByRelatedEntity("CONTRACT_MILESTONE", milestone.id);
    if (existingEscrow) {
      throw new EscrowAlreadyFundedError();
    }

    const payment = await this.initiatePayment.execute({
      amount: milestone.amount,
      currency: input.currency,
      regionId: input.regionId,
      customerUserId: input.customerUserId,
      description: `Contract milestone: ${milestone.title}`,
      relatedEntityType: "CONTRACT_MILESTONE",
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
      relatedEntityType: "CONTRACT_MILESTONE",
      relatedEntityId: milestone.id,
      gatewayProvider: "internal",
      gatewayRef: payment.gatewayRef,
      idempotencyKey: `${input.idempotencyKey}:fund`,
    });

    return { escrowId };
  }
}
