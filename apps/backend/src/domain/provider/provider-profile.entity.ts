export type VerificationStatus =
  | "UNVERIFIED"
  | "PENDING_REVIEW"
  | "VERIFIED"
  | "REJECTED"
  | "NEEDS_MORE_INFO"
  | "EXPIRED"
  | "REVOKED";

export type AccountLifecycleStatus = "ACTIVE" | "SUSPENDED" | "DELETED";

export type AvailabilityMode = "ONLINE" | "OFFLINE" | "VACATION" | "TEMPORARILY_UNAVAILABLE" | "EMERGENCY_OFFLINE";

export interface ProviderProfile {
  id: string;
  userId: string;
  companyId: string | null;
  businessName: string;
  bio: string | null;
  businessLogoUrl: string | null;
  taxNumber: string | null;
  yearsOfExperience: number | null;
  skills: string[];
  travelDistanceKm: number | null;
  remoteAvailable: boolean;
  emergencyAvailable: boolean;
  verificationStatus: VerificationStatus;
  verifiedAt: Date | null;
  ratingAverage: number;
  ratingCount: number;
  completedJobsCount: number;
  cancellationRate: number;
  avgResponseSeconds: number | null;
  isAvailable: boolean;
  availabilityMode: AvailabilityMode;
  status: AccountLifecycleStatus;
  suspendedAt: Date | null;
  suspendedReason: string | null;
  deletedAt: Date | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  createdAt: Date;
}
