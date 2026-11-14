import type { ContractMilestoneRepository } from "@/domain/contract/contract-milestone.repository";
import type { ContractRepository } from "@/domain/contract/contract.repository";
import type { ProviderProfileRepository } from "@/domain/provider/provider-profile.repository";
import type { EscrowRepository } from "@/domain/finance/escrow-repository";
import type { WalletRepository } from "@/domain/finance/wallet-repository";
import type { CommissionCalculator } from "@/domain/finance/commission-calculator";
import type { ReleaseEscrowUseCase } from "@/application/finance/release-escrow.use-case";
import type { UpdateContractMilestoneStatusUseCase } from "./update-contract-milestone-status.use-case";
import { ContractMilestoneNotFoundError, ContractNotFoundError } from "./errors";
import { EscrowNotFoundError } from "@/application/finance/errors";
import { ProviderProfileNotFoundError } from "@/application/provider/errors";

export interface ReleaseContractMilestonePaymentInput {
  milestoneId: string;
}

// Replaces the manual admin "mark milestone paid" stand-in (built during
// the backend integration audit, before the Financial Core existed) with
// the real thing: an APPROVED milestone's escrow is actually released —
// provider share credited to their wallet, platform commission recorded
// — and only then does the milestone move to PAID. If no escrow was ever
// funded for this milestone (FundContractMilestoneUseCase was never
// called), this fails loudly with EscrowNotFoundError rather than
// silently flipping a status with no money behind it.
export class ReleaseContractMilestonePaymentUseCase {
  constructor(
    private readonly milestones: ContractMilestoneRepository,
    private readonly contracts: ContractRepository,
    private readonly providers: ProviderProfileRepository,
    private readonly wallets: WalletRepository,
    private readonly escrows: EscrowRepository,
    private readonly commission: CommissionCalculator,
    private readonly releaseEscrow: ReleaseEscrowUseCase,
    private readonly milestoneStatus: UpdateContractMilestoneStatusUseCase,
  ) {}

  async execute(input: ReleaseContractMilestonePaymentInput): Promise<{ providerAmount: number; commissionAmount: number }> {
    const milestone = await this.milestones.findById(input.milestoneId);
    if (!milestone) {
      throw new ContractMilestoneNotFoundError();
    }
    const contract = await this.contracts.findById(milestone.contractId);
    if (!contract) {
      throw new ContractNotFoundError();
    }

    const escrow = await this.escrows.findByRelatedEntity("CONTRACT_MILESTONE", milestone.id);
    if (!escrow) {
      throw new EscrowNotFoundError();
    }

    const provider = await this.providers.findById(contract.providerId);
    if (!provider) {
      throw new ProviderProfileNotFoundError();
    }
    const wallet = await this.wallets.getOrCreateForUser(provider.userId, escrow.currency);

    const commissionResult = await this.commission.resolve({ amount: escrow.amount, providerId: contract.providerId });

    const result = await this.releaseEscrow.execute({
      escrowId: escrow.id,
      providerWalletId: wallet.id,
      commissionPercentage: commissionResult.commissionPercentage,
      gatewayProvider: "internal",
    });

    await this.milestoneStatus.execute({ milestoneId: milestone.id, toStatus: "PAID" });

    return { providerAmount: result.providerAmount, commissionAmount: result.commissionAmount };
  }
}
