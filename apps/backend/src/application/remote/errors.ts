// Shared across Remote use cases so the same condition isn't represented
// by different error classes/messages depending on which use case hit it.
export class RemoteEngagementNotFoundError extends Error {
  constructor() {
    super("Remote engagement not found");
  }
}

export class InvalidRemoteEngagementStatusTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Cannot move a remote engagement from ${from} to ${to}`);
  }
}

export class RemoteEngagementHasUnpaidMilestonesError extends Error {
  constructor() {
    super("All milestones must be PAID before the engagement can be completed");
  }
}

export class RemoteMilestoneNotFoundError extends Error {
  constructor() {
    super("Remote milestone not found");
  }
}

export class InvalidRemoteMilestoneStatusTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Cannot move a remote milestone from ${from} to ${to}`);
  }
}

export class RemoteRevisionNotFoundError extends Error {
  constructor() {
    super("Remote revision not found");
  }
}

export class InvalidRemoteRevisionStatusTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Cannot move a remote revision from ${from} to ${to}`);
  }
}

// Same eligibility gate as application/contract/errors.ts'
// ProviderNotEligibleError — audit finding, fixed here.
export class ProviderNotEligibleError extends Error {
  constructor() {
    super("This provider is not active and verified");
  }
}
