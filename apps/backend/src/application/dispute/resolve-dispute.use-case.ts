import type { DisputeRepository } from "@/domain/dispute/dispute-repository";
import type { EscrowRepository } from "@/domain/finance/escrow-repository";
import type { AuditLogWriter } from "@/domain/audit/audit-log-writer";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import type { ReleaseEscrowUseCase } from "@/application/finance/release-escrow.use-case";
import type { RefundEscrowUseCase } from "@/application/finance/refund-escrow.use-case";
import { DisputeNotFoundError, DisputeNotOpenError, InvalidDisputeSplitError } from "./errors";

export type DisputeResolutionDecision =
  | { decision: "RELEASE_TO_PROVIDER"; providerWalletId: string; commissionPercentage: number; gatewayProvider: string }
  | { decision: "REFUND_CUSTOMER"; gatewayProvider: string }
  | {
      decision: "PARTIAL_SPLIT";
      providerAmount: number;
      refundAmount: number;
      providerWalletId: string;
      commissionPercentage: number;
      gatewayProvider: string;
    };

export interface ResolveDisputeInput {
  disputeId: string;
  resolvedById: string;
  resolutionNotes: string;
  resolution: DisputeResolutionDecision;
}

// The authorized-resolution half of Phase 10: an admin's decision is the
// only thing allowed to move a DISPUTED escrow's money — never a normal
// service-completion flow (that's exactly what OpenDisputeUseCase's lock
// prevents). Un-locks the escrow back to HELD immediately before calling
// the same ReleaseEscrowUseCase/RefundEscrowUseCase every other flow
// uses, so dispute resolution doesn't duplicate release/refund mechanics
// — it just authorizes reaching them from a DISPUTED state.
export class ResolveDisputeUseCase {
  constructor(
    private readonly disputes: DisputeRepository,
    private readonly escrows: EscrowRepository,
    private readonly releaseEscrow: ReleaseEscrowUseCase,
    private readonly refundEscrow: RefundEscrowUseCase,
    private readonly auditLog: AuditLogWriter,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: ResolveDisputeInput): Promise<void> {
    const dispute = await this.disputes.findById(input.disputeId);
    if (!dispute) {
      throw new DisputeNotFoundError();
    }
    if (dispute.status !== "OPEN" && dispute.status !== "UNDER_REVIEW") {
      throw new DisputeNotOpenError();
    }

    const escrow = await this.escrows.findByRelatedEntity(dispute.relatedEntityType, dispute.relatedEntityId);
    const idempotencyKey = `dispute-resolve:${input.disputeId}`;

    if (escrow && escrow.status === "DISPUTED") {
      await this.escrows.updateStatus(escrow.id, "HELD");

      if (input.resolution.decision === "RELEASE_TO_PROVIDER") {
        await this.releaseEscrow.execute({
          escrowId: escrow.id,
          providerWalletId: input.resolution.providerWalletId,
          commissionPercentage: input.resolution.commissionPercentage,
          gatewayProvider: input.resolution.gatewayProvider,
          idempotencyKey,
        });
      } else if (input.resolution.decision === "REFUND_CUSTOMER") {
        await this.refundEscrow.execute({
          escrowId: escrow.id,
          gatewayProvider: input.resolution.gatewayProvider,
          reason: `Dispute resolved: ${input.resolutionNotes}`,
          idempotencyKey,
        });
      } else {
        const remaining = escrow.amount - escrow.releasedAmount - escrow.refundedAmount;
        if (
          input.resolution.providerAmount <= 0 ||
          input.resolution.refundAmount <= 0 ||
          input.resolution.providerAmount + input.resolution.refundAmount > remaining
        ) {
          throw new InvalidDisputeSplitError();
        }
        await this.releaseEscrow.execute({
          escrowId: escrow.id,
          providerWalletId: input.resolution.providerWalletId,
          commissionPercentage: input.resolution.commissionPercentage,
          gatewayProvider: input.resolution.gatewayProvider,
          releaseAmount: input.resolution.providerAmount,
          idempotencyKey: `${idempotencyKey}:release`,
        });
        await this.refundEscrow.execute({
          escrowId: escrow.id,
          gatewayProvider: input.resolution.gatewayProvider,
          reason: `Dispute resolved (partial split): ${input.resolutionNotes}`,
          refundAmount: input.resolution.refundAmount,
          idempotencyKey: `${idempotencyKey}:refund`,
        });
      }
    }

    const claimed = await this.disputes.compareAndSetStatus(dispute.id, dispute.status, "RESOLVED", input.resolutionNotes);
    if (!claimed) {
      throw new DisputeNotOpenError();
    }

    await this.auditLog.write({
      actorId: input.resolvedById,
      action: "dispute.resolve",
      entityType: "Dispute",
      entityId: dispute.id,
      metadata: { decision: input.resolution.decision, notes: input.resolutionNotes },
    });

    await this.events.publish({
      type: "DisputeResolved",
      payload: { decision: input.resolution.decision },
      relatedEntityType: dispute.relatedEntityType,
      relatedEntityId: dispute.relatedEntityId,
    });
  }
}
