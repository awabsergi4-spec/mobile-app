// Shared across Provider use cases so the same condition isn't represented
// by different error classes/messages depending on which use case hit it.
export class ProviderProfileNotFoundError extends Error {
  constructor() {
    super("Provider profile not found");
  }
}

export class ProviderProfileAlreadyExistsError extends Error {
  constructor() {
    super("A provider profile already exists for this user");
  }
}

export class ProviderVerificationDocumentsRequiredError extends Error {
  constructor() {
    super("At least one document is required before submitting for verification");
  }
}

export class ProviderVerificationAlreadyPendingError extends Error {
  constructor() {
    super("Provider verification is already pending review");
  }
}

// DELETED is a terminal lifecycle state — audit finding: Suspend/Reactivate
// previously had no guard against acting on an already-deleted profile,
// which would let a deleted provider be silently resurrected via
// ReactivateProviderUseCase. Fixed by rejecting any lifecycle transition
// attempted from DELETED.
export class InvalidProviderLifecycleTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Cannot move a provider profile from ${from} to ${to}`);
  }
}
