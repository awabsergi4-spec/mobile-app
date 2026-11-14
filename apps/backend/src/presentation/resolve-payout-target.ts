import { contractMilestoneRepository, contractRepository } from "@/infrastructure/contract/contract-services";
import { remoteEngagementRepository, remoteMilestoneRepository } from "@/infrastructure/remote/remote-services";
import { providerProfileRepository } from "@/infrastructure/provider/provider-services";
import { walletRepository, commissionCalculator } from "@/infrastructure/finance/finance-services";

export class UnresolvablePayoutTargetError extends Error {
  constructor(relatedEntityType: string) {
    super(`Cannot determine the payout provider wallet for a dispute on ${relatedEntityType} automatically`);
  }
}

// Resolves the same providerWalletId + commissionPercentage the normal
// (non-dispute) release path derives server-side — see
// ReleaseContractMilestonePaymentUseCase / ReleaseRemoteMilestonePaymentUseCase.
// Only wired for the two entity types that have real escrow integration,
// matching the scoping in POST /api/v1/disputes. Lives in presentation/
// (not application/) because it wires infrastructure singletons directly —
// same layering as admin-session.ts/auth-guards.ts — and is shared by the
// REST API route and the Admin Platform's dispute-resolution page: one
// implementation, two callers, per the "no duplicated business logic" rule.
export async function resolvePayoutTarget(
  relatedEntityType: string,
  relatedEntityId: string,
  escrowAmount: number,
  escrowCurrency: string,
): Promise<{ providerWalletId: string; commissionPercentage: number }> {
  if (relatedEntityType === "CONTRACT_MILESTONE") {
    const milestone = await contractMilestoneRepository.findById(relatedEntityId);
    const contract = milestone ? await contractRepository.findById(milestone.contractId) : null;
    if (!contract) {
      throw new UnresolvablePayoutTargetError(relatedEntityType);
    }
    const provider = await providerProfileRepository.findById(contract.providerId);
    if (!provider) {
      throw new UnresolvablePayoutTargetError(relatedEntityType);
    }
    const wallet = await walletRepository.getOrCreateForUser(provider.userId, escrowCurrency);
    const commission = await commissionCalculator.resolve({ amount: escrowAmount, providerId: contract.providerId });
    return { providerWalletId: wallet.id, commissionPercentage: commission.commissionPercentage };
  }

  if (relatedEntityType === "REMOTE_MILESTONE") {
    const milestone = await remoteMilestoneRepository.findById(relatedEntityId);
    const engagement = milestone ? await remoteEngagementRepository.findById(milestone.engagementId) : null;
    if (!engagement) {
      throw new UnresolvablePayoutTargetError(relatedEntityType);
    }
    const provider = await providerProfileRepository.findById(engagement.providerId);
    if (!provider) {
      throw new UnresolvablePayoutTargetError(relatedEntityType);
    }
    const wallet = await walletRepository.getOrCreateForUser(provider.userId, escrowCurrency);
    const commission = await commissionCalculator.resolve({ amount: escrowAmount, providerId: engagement.providerId });
    return { providerWalletId: wallet.id, commissionPercentage: commission.commissionPercentage };
  }

  throw new UnresolvablePayoutTargetError(relatedEntityType);
}
