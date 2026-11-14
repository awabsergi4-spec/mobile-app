export class DisputeNotFoundError extends Error {
  constructor() {
    super("Dispute not found");
  }
}

export class DisputeNotOpenError extends Error {
  constructor() {
    super("This dispute is not open or under review");
  }
}

export class InvalidDisputeSplitError extends Error {
  constructor() {
    super("Split amounts must be positive and sum to no more than the escrow's held amount");
  }
}
