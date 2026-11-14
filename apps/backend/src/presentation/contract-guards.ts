import type { Contract } from "@/domain/contract/contract.entity";
import type { ContractProject } from "@/domain/contract/contract-project.entity";
import type { ProviderProfileRepository } from "@/domain/provider/provider-profile.repository";

export class NotContractPartyError extends Error {
  constructor() {
    super("You are not the customer or provider on this contract");
  }
}

// A contract's only two legitimate parties are the project's customer and
// the awarded provider — resolved via the caller's own ProviderProfile,
// same pattern as presentation/on-demand-guards.ts.
export async function requireContractParty(
  contract: Contract,
  project: ContractProject,
  userId: string,
  providers: ProviderProfileRepository,
): Promise<"customer" | "provider"> {
  if (project.customerId === userId) {
    return "customer";
  }

  const providerProfile = await providers.findByUserId(userId);
  if (providerProfile && providerProfile.id === contract.providerId) {
    return "provider";
  }

  throw new NotContractPartyError();
}
