// Shared across On-Demand use cases so the same condition isn't
// represented by different error classes/messages depending on which use
// case hit it.
export class OnDemandRequestNotFoundError extends Error {
  constructor() {
    super("On-demand request not found");
  }
}

export class OnDemandAssignmentNotFoundError extends Error {
  constructor() {
    super("On-demand assignment not found");
  }
}

export class OnDemandAssignmentNotOfferedError extends Error {
  constructor() {
    super("This assignment is no longer open for a response");
  }
}

export class NotOfferedProviderError extends Error {
  constructor() {
    super("This assignment was not offered to this provider");
  }
}

export class InvalidOnDemandStatusTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Cannot move an on-demand request from ${from} to ${to}`);
  }
}
