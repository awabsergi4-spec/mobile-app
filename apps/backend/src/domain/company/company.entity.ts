// Structurally identical to the VerificationStatus/AccountLifecycleStatus
// unions in domain/provider/provider-profile.entity.ts by design — the
// schema comment on Company documents these as the same lifecycle meaning,
// but Company and ProviderProfile stay separate bounded contexts (see the
// CompanyDocument/ProviderDocument mirroring decision), so each declares
// its own copy rather than cross-importing between contexts.
export type VerificationStatus =
  | "UNVERIFIED"
  | "PENDING_REVIEW"
  | "VERIFIED"
  | "REJECTED"
  | "NEEDS_MORE_INFO"
  | "EXPIRED"
  | "REVOKED";

export type AccountLifecycleStatus = "ACTIVE" | "SUSPENDED" | "DELETED";

export type CompanyRole = "OWNER" | "MANAGER" | "STAFF";

export interface Company {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  regionId: string;
  verificationStatus: VerificationStatus;
  verifiedAt: Date | null;
  status: AccountLifecycleStatus;
  suspendedAt: Date | null;
  suspendedReason: string | null;
  deletedAt: Date | null;
  createdAt: Date;
}
