import type { CreateRemoteEngagementInput, RemoteEngagementRepository } from "@/domain/remote/remote-engagement.repository";
import type { RemoteEngagement } from "@/domain/remote/remote-engagement.entity";
import type { ProviderProfileRepository } from "@/domain/provider/provider-profile.repository";
import { ProviderNotEligibleError } from "./errors";

// Unlike Contract (post → bid → award), Remote engagements are created
// directly against a specific provider — the customer already knows who
// they're hiring (found via search/profile, terms agreed over chat), so
// there's no proposal/matching step in this bounded context. See
// RemoteEngagement in the schema: no OPEN_FOR_BIDS-equivalent status.
//
// The eligibility check (ACTIVE + VERIFIED) still applies here even
// without a matching step — same gate On-Demand's ProviderMatcher and
// Contract's SubmitContractBidUseCase/AwardContractBidUseCase enforce.
// Without it, a customer could directly engage a suspended or
// never-verified provider by ID (audit finding, fixed here).
export class CreateRemoteEngagementUseCase {
  constructor(
    private readonly engagements: RemoteEngagementRepository,
    private readonly providers: ProviderProfileRepository,
  ) {}

  async execute(input: CreateRemoteEngagementInput): Promise<RemoteEngagement> {
    const provider = await this.providers.findById(input.providerId);
    if (!provider || provider.status !== "ACTIVE" || provider.verificationStatus !== "VERIFIED") {
      throw new ProviderNotEligibleError();
    }

    return this.engagements.create(input);
  }
}
