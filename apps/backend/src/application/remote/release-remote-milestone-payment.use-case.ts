import type { RemoteMilestoneRepository } from "@/domain/remote/remote-milestone.repository";
import type { RemoteEngagementRepository } from "@/domain/remote/remote-engagement.repository";
import type { ProviderProfileRepository } from "@/domain/provider/provider-profile.repository";
import type { EscrowRepository } from "@/domain/finance/escrow-repository";
import type { WalletRepository } from "@/domain/finance/wallet-repository";
import type { CommissionCalculator } from "@/domain/finance/commission-calculator";
import type { ReleaseEscrowUseCase } from "@/application/finance/release-escrow.use-case";
import type { UpdateRemoteMilestoneStatusUseCase } from "./update-remote-milestone-status.use-case";
import { RemoteEngagementNotFoundError, RemoteMilestoneNotFoundError } from "./errors";
import { EscrowNotFoundError } from "@/application/finance/errors";
import { ProviderProfileNotFoundError } from "@/application/provider/errors";

export interface ReleaseRemoteMilestonePaymentInput {
  milestoneId: string;
}

// Mirrors application/contract/release-contract-milestone-payment.use-case.ts
// exactly — same replacement of the manual admin mark-paid stand-in with
// a real escrow release.
export class ReleaseRemoteMilestonePaymentUseCase {
  constructor(
    private readonly milestones: RemoteMilestoneRepository,
    private readonly engagements: RemoteEngagementRepository,
    private readonly providers: ProviderProfileRepository,
    private readonly wallets: WalletRepository,
    private readonly escrows: EscrowRepository,
    private readonly commission: CommissionCalculator,
    private readonly releaseEscrow: ReleaseEscrowUseCase,
    private readonly milestoneStatus: UpdateRemoteMilestoneStatusUseCase,
  ) {}

  async execute(input: ReleaseRemoteMilestonePaymentInput): Promise<{ providerAmount: number; commissionAmount: number }> {
    const milestone = await this.milestones.findById(input.milestoneId);
    if (!milestone) {
      throw new RemoteMilestoneNotFoundError();
    }
    const engagement = await this.engagements.findById(milestone.engagementId);
    if (!engagement) {
      throw new RemoteEngagementNotFoundError();
    }

    const escrow = await this.escrows.findByRelatedEntity("REMOTE_MILESTONE", milestone.id);
    if (!escrow) {
      throw new EscrowNotFoundError();
    }

    const provider = await this.providers.findById(engagement.providerId);
    if (!provider) {
      throw new ProviderProfileNotFoundError();
    }
    const wallet = await this.wallets.getOrCreateForUser(provider.userId, escrow.currency);

    const commissionResult = await this.commission.resolve({ amount: escrow.amount, providerId: engagement.providerId });

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
