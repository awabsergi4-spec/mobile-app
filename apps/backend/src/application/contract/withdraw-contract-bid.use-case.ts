import type { ContractBidRepository } from "@/domain/contract/contract-bid.repository";
import { ContractBidNotFoundError, ContractBidNotSubmittedError, NotBidOwnerError } from "./errors";

export interface WithdrawContractBidInput {
  bidId: string;
  providerId: string;
}

export class WithdrawContractBidUseCase {
  constructor(private readonly bids: ContractBidRepository) {}

  async execute(input: WithdrawContractBidInput): Promise<void> {
    const bid = await this.bids.findById(input.bidId);
    if (!bid) {
      throw new ContractBidNotFoundError();
    }
    if (bid.providerId !== input.providerId) {
      throw new NotBidOwnerError();
    }
    if (bid.status !== "SUBMITTED") {
      throw new ContractBidNotSubmittedError();
    }

    await this.bids.updateStatus(bid.id, "WITHDRAWN");
  }
}
