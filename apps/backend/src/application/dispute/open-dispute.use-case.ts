import type { DisputeRecord, DisputeRepository } from "@/domain/dispute/dispute-repository";
import type { EscrowRepository } from "@/domain/finance/escrow-repository";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";

export interface OpenDisputeInput {
  raisedById: string;
  relatedEntityType: string;
  relatedEntityId: string;
  reason: string;
}

// Financial Core Phase 10: opening a dispute against an entity that has a
// funded Escrow locks it immediately — HELD/PARTIALLY_RELEASED -> DISPUTED
// — so normal service-completion flows can no longer release or refund
// it. ReleaseEscrowUseCase/RefundEscrowUseCase already reject anything
// that isn't HELD/PARTIALLY_RELEASED, so this lock is enforced by the
// same guard those use cases already had, not a new bypass-check bolted
// on separately. No escrow existing for the entity is not an error —
// plenty of disputes (a review dispute, a non-financial complaint) have
// no money attached.
export class OpenDisputeUseCase {
  constructor(
    private readonly disputes: DisputeRepository,
    private readonly escrows: EscrowRepository,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: OpenDisputeInput): Promise<DisputeRecord> {
    const dispute = await this.disputes.create(input);

    const escrow = await this.escrows.findByRelatedEntity(input.relatedEntityType, input.relatedEntityId);
    if (escrow && (escrow.status === "HELD" || escrow.status === "PARTIALLY_RELEASED")) {
      await this.escrows.updateStatus(escrow.id, "DISPUTED", { disputedAt: new Date() });
    }

    await this.events.publish({
      type: "DisputeOpened",
      payload: { reason: input.reason, escrowLocked: Boolean(escrow) },
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
    });

    return dispute;
  }
}
