import type { RemoteEngagement } from "@/domain/remote/remote-engagement.entity";
import type { ProviderProfileRepository } from "@/domain/provider/provider-profile.repository";

export class NotRemoteEngagementPartyError extends Error {
  constructor() {
    super("You are not the customer or provider on this engagement");
  }
}

// Same shape as presentation/contract-guards.ts: the only two legitimate
// parties are the customer and the engaged provider, resolved via the
// caller's own ProviderProfile.
export async function requireRemoteEngagementParty(
  engagement: RemoteEngagement,
  userId: string,
  providers: ProviderProfileRepository,
): Promise<"customer" | "provider"> {
  if (engagement.customerId === userId) {
    return "customer";
  }

  const providerProfile = await providers.findByUserId(userId);
  if (providerProfile && providerProfile.id === engagement.providerId) {
    return "provider";
  }

  throw new NotRemoteEngagementPartyError();
}
