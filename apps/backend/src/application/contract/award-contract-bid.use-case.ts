import type { ContractProjectRepository } from "@/domain/contract/contract-project.repository";
import type { ContractBidRepository } from "@/domain/contract/contract-bid.repository";
import type { Contract } from "@/domain/contract/contract.entity";
import type { ContractRepository } from "@/domain/contract/contract.repository";
import type { ProviderProfileRepository } from "@/domain/provider/provider-profile.repository";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import {
  ContractBidNotFoundError,
  ContractBidNotSubmittedError,
  ContractProjectNotOpenError,
  ProviderNotEligibleError,
} from "./errors";

export interface AwardContractBidInput {
  bidId: string;
}

// Awarding is the project → contract handoff: the accepted bid becomes
// ACCEPTED, every other SUBMITTED bid on the project is rejected in one
// call (mirrors OnDemandAssignmentRepository.expirePendingOffers), the
// project moves to AWARDED, and a Contract row is created from the bid's
// own amount/provider — the bid IS the contract terms, not a separate
// negotiation step.
//
// Claiming the project (OPEN_FOR_BIDS -> AWARDED) is done as one atomic
// conditional UPDATE, not a plain read-then-write: a customer double-
// clicking "award" on two different bids (or two concurrent requests for
// any reason) must not be able to create two Contracts for the same
// project. Whichever request's compareAndSetStatus call actually flips
// the row wins; the loser sees ContractProjectNotOpenError. Audit finding.
export class AwardContractBidUseCase {
  constructor(
    private readonly projects: ContractProjectRepository,
    private readonly bids: ContractBidRepository,
    private readonly contracts: ContractRepository,
    private readonly providers: ProviderProfileRepository,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: AwardContractBidInput): Promise<Contract> {
    const bid = await this.bids.findById(input.bidId);
    if (!bid) {
      throw new ContractBidNotFoundError();
    }
    if (bid.status !== "SUBMITTED") {
      throw new ContractBidNotSubmittedError();
    }

    // Re-checked at award time, not just at bid submission — the provider
    // may have been suspended in the time between the two, and award is
    // the moment real commitment (a Contract) gets created.
    const provider = await this.providers.findById(bid.providerId);
    if (!provider || provider.status !== "ACTIVE" || provider.verificationStatus !== "VERIFIED") {
      throw new ProviderNotEligibleError();
    }

    const claimed = await this.projects.compareAndSetStatus(bid.projectId, "OPEN_FOR_BIDS", "AWARDED");
    if (!claimed) {
      throw new ContractProjectNotOpenError();
    }

    await this.bids.updateStatus(bid.id, "ACCEPTED");
    await this.bids.rejectOtherSubmittedBids(bid.projectId, bid.id);

    const contract = await this.contracts.create({
      projectId: bid.projectId,
      providerId: bid.providerId,
      totalAmount: bid.amount,
    });

    await this.events.publish({
      type: "ContractAwarded",
      payload: { providerId: bid.providerId, totalAmount: bid.amount },
      relatedEntityType: "CONTRACT",
      relatedEntityId: contract.id,
    });

    return contract;
  }
}
