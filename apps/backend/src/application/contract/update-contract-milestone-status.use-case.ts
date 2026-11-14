import type { ContractMilestone, ContractMilestoneRepository, MilestoneStatus } from "@/domain/contract/contract-milestone.repository";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import { ContractMilestoneNotFoundError, InvalidMilestoneStatusTransitionError } from "./errors";

// PENDING → IN_PROGRESS → SUBMITTED are provider-driven; SUBMITTED →
// APPROVED is customer-driven; APPROVED → PAID is system/workflow-driven
// (a future RELEASE_ESCROW action executor calling this after moving
// money, ADR-009 — this use case owns the status field, not the payment).
// One use case walks the whole line for the same reason
// UpdateOnDemandStatusUseCase does: it's one small state machine, not
// four distinct business operations. Actor authorization for each edge is
// enforced by the caller (route layer), not here.
const ALLOWED_TRANSITIONS: Record<string, MilestoneStatus[]> = {
  PENDING: ["IN_PROGRESS"],
  IN_PROGRESS: ["SUBMITTED"],
  SUBMITTED: ["APPROVED"],
  APPROVED: ["PAID"],
};

const EVENT_TYPE_BY_STATUS: Record<string, string> = {
  SUBMITTED: "ContractMilestoneSubmitted",
  APPROVED: "ContractMilestoneApproved",
  PAID: "ContractMilestonePaid",
};

export interface UpdateContractMilestoneStatusInput {
  milestoneId: string;
  toStatus: MilestoneStatus;
}

export class UpdateContractMilestoneStatusUseCase {
  constructor(
    private readonly milestones: ContractMilestoneRepository,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: UpdateContractMilestoneStatusInput): Promise<ContractMilestone> {
    const milestone = await this.milestones.findById(input.milestoneId);
    if (!milestone) {
      throw new ContractMilestoneNotFoundError();
    }

    const allowed = ALLOWED_TRANSITIONS[milestone.status] ?? [];
    if (!allowed.includes(input.toStatus)) {
      throw new InvalidMilestoneStatusTransitionError(milestone.status, input.toStatus);
    }

    const updated = await this.milestones.updateStatus(input.milestoneId, input.toStatus);

    const eventType = EVENT_TYPE_BY_STATUS[input.toStatus];
    if (eventType) {
      await this.events.publish({
        type: eventType,
        payload: { contractId: milestone.contractId, amount: milestone.amount },
        relatedEntityType: "CONTRACT_MILESTONE",
        relatedEntityId: milestone.id,
      });
    }

    return updated;
  }
}
