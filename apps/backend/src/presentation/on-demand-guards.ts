import type { OnDemandRequest } from "@/domain/on-demand/on-demand-request.entity";
import type { ProviderProfileRepository } from "@/domain/provider/provider-profile.repository";
import type { OnDemandAssignmentRepository } from "@/domain/on-demand/on-demand-assignment.repository";

export class NotRequestPartyError extends Error {
  constructor() {
    super("You are not the customer or an assigned provider on this request");
  }
}

// A request's only two legitimate viewers are its customer and whichever
// provider currently holds (or held) an assignment on it — resolved via
// the caller's own ProviderProfile rather than a separate access-list
// table, since ProviderProfile is already the source of truth for "which
// provider is this user."
export async function requireOnDemandRequestParty(
  request: OnDemandRequest,
  userId: string,
  providers: ProviderProfileRepository,
  assignments: OnDemandAssignmentRepository,
): Promise<void> {
  if (request.customerId === userId) {
    return;
  }

  const providerProfile = await providers.findByUserId(userId);
  if (providerProfile) {
    const requestAssignments = await assignments.listByRequestId(request.id);
    if (requestAssignments.some((assignment) => assignment.providerId === providerProfile.id)) {
      return;
    }
  }

  throw new NotRequestPartyError();
}
