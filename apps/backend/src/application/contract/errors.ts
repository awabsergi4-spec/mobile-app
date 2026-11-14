// Shared across Contract use cases so the same condition isn't
// represented by different error classes/messages depending on which use
// case hit it.
export class ContractProjectNotFoundError extends Error {
  constructor() {
    super("Contract project not found");
  }
}

export class ContractProjectNotOpenError extends Error {
  constructor() {
    super("This project is not open for bids");
  }
}

export class ContractBidNotFoundError extends Error {
  constructor() {
    super("Contract bid not found");
  }
}

export class ContractBidNotSubmittedError extends Error {
  constructor() {
    super("This bid is no longer open — it has already been withdrawn or resolved");
  }
}

export class NotBidOwnerError extends Error {
  constructor() {
    super("This bid does not belong to this provider");
  }
}

export class ContractNotFoundError extends Error {
  constructor() {
    super("Contract not found");
  }
}

export class ContractMilestoneNotFoundError extends Error {
  constructor() {
    super("Contract milestone not found");
  }
}

export class InvalidMilestoneStatusTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Cannot move a contract milestone from ${from} to ${to}`);
  }
}

export class InvalidContractStatusTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Cannot move a contract from ${from} to ${to}`);
  }
}

export class ContractHasUnpaidMilestonesError extends Error {
  constructor() {
    super("All milestones must be PAID before the contract can be completed");
  }
}

// Mirrors the eligibility gate DistanceRatingProviderMatcher already
// enforces for On-Demand (status ACTIVE + verificationStatus VERIFIED) —
// Contract had no equivalent check, so a suspended/unverified provider
// could bid and be awarded work. Audit finding, fixed here.
export class ProviderNotEligibleError extends Error {
  constructor() {
    super("This provider is not active and verified");
  }
}
