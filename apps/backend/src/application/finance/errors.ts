// Shared across Financial Core use cases so the same condition isn't
// represented by different error classes/messages depending on which use
// case hit it.
export class PaymentTransactionNotFoundError extends Error {
  constructor() {
    super("Payment transaction not found");
  }
}

export class PaymentNotCapturableError extends Error {
  constructor() {
    super("This payment is not in a capturable state");
  }
}

export class PaymentCaptureFailedError extends Error {
  constructor(reason?: string) {
    super(reason ? `Payment capture failed: ${reason}` : "Payment capture failed");
  }
}

export class EscrowNotFoundError extends Error {
  constructor() {
    super("Escrow not found");
  }
}

export class EscrowNotHeldError extends Error {
  constructor(escrowId: string) {
    super(`Escrow ${escrowId} is not in a releasable state`);
  }
}

export class EscrowDisputedError extends Error {
  constructor() {
    super("This escrow is under an open dispute and cannot be released through the normal flow");
  }
}

export class InvalidReleaseAmountError extends Error {
  constructor() {
    super("Release amount must be positive and cannot exceed the escrow's remaining held amount");
  }
}

export class InvalidEscrowRefundAmountError extends Error {
  constructor() {
    super("Refund amount must be positive and cannot exceed the escrow's remaining held amount");
  }
}

// Thrown when the atomic applyRelease/applyRefund CAS loses a race — the
// escrow changed between this request's read and its write. Safe to
// retry: re-reading the escrow will see the up-to-date remaining amount.
export class EscrowReleaseConflictError extends Error {
  constructor() {
    super("This escrow was modified concurrently — retry with the current remaining amount");
  }
}

export class InsufficientWalletBalanceError extends Error {
  constructor(bucket: string) {
    super(`Insufficient ${bucket} balance for this operation`);
  }
}

export class WalletFrozenError extends Error {
  constructor() {
    super("This wallet is frozen");
  }
}

export class WithdrawalNotFoundError extends Error {
  constructor() {
    super("Withdrawal not found");
  }
}

export class InvalidWithdrawalStatusTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Cannot move a withdrawal from ${from} to ${to}`);
  }
}

export class SettlementNotFoundError extends Error {
  constructor() {
    super("Settlement not found");
  }
}

export class InvalidSettlementStatusTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Cannot move a settlement from ${from} to ${to}`);
  }
}

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

export class InvalidRefundAmountError extends Error {
  constructor() {
    super("Refund amount must be positive and cannot exceed the original captured amount");
  }
}
