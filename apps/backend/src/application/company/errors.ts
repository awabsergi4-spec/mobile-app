// Shared across Company use cases so the same condition isn't represented
// by different error classes/messages depending on which use case hit it.
export class CompanyNotFoundError extends Error {
  constructor() {
    super("Company not found");
  }
}

// DELETED is a terminal lifecycle state — same audit finding as
// application/provider/errors.ts' InvalidProviderLifecycleTransitionError.
export class InvalidCompanyLifecycleTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Cannot move a company from ${from} to ${to}`);
  }
}

export class CompanyAlreadyExistsError extends Error {
  constructor() {
    super("This account already owns a company");
  }
}

export class CompanyVerificationDocumentsRequiredError extends Error {
  constructor() {
    super("At least one document is required before submitting for verification");
  }
}

export class CompanyVerificationAlreadyPendingError extends Error {
  constructor() {
    super("Company verification is already pending review");
  }
}

export class CompanyMemberNotFoundError extends Error {
  constructor() {
    super("Company member not found");
  }
}

export class CompanyMemberAlreadyExistsError extends Error {
  constructor() {
    super("This user is already a member of the company");
  }
}

export class CompanyOwnerRoleProtectedError extends Error {
  constructor() {
    super("The company owner cannot be removed or have their role changed");
  }
}

export class CompanyMemberInsufficientRoleError extends Error {
  constructor() {
    super("Only the company owner or a manager can perform this action");
  }
}

export class CompanyInvitationNotFoundError extends Error {
  constructor() {
    super("Company invitation not found");
  }
}

export class CompanyInvitationAlreadyPendingError extends Error {
  constructor() {
    super("A pending invitation already exists for this phone number");
  }
}

export class CompanyInvitationNotPendingError extends Error {
  constructor() {
    super("This invitation has already been responded to or is no longer valid");
  }
}

export class CompanyInvitationExpiredError extends Error {
  constructor() {
    super("This invitation has expired");
  }
}
