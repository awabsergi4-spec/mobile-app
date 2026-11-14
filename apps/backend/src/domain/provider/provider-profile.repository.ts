import type { AccountLifecycleStatus, AvailabilityMode, ProviderProfile, VerificationStatus } from "./provider-profile.entity";

export interface CreateProviderProfileInput {
  userId: string;
  businessName: string;
  bio?: string;
  yearsOfExperience?: number;
  skills?: string[];
  travelDistanceKm?: number;
  remoteAvailable?: boolean;
  companyId?: string;
}

export interface UpdateProviderProfileInput {
  businessName?: string;
  bio?: string;
  businessLogoUrl?: string;
  taxNumber?: string;
  yearsOfExperience?: number;
  skills?: string[];
  travelDistanceKm?: number;
  remoteAvailable?: boolean;
  emergencyAvailable?: boolean;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface SearchProviderProfilesFilter {
  query?: string; // matches businessName, case-insensitive
  status?: AccountLifecycleStatus;
  verificationStatus?: VerificationStatus;
  // Providers offering this ServiceCategory — the public "browse
  // providers to hire" filter (Remote engagement creation, and later
  // provider discovery generally).
  categoryId?: string;
  remoteAvailable?: boolean;
  limit?: number;
  cursor?: string;
}

// Interface only — implemented in infrastructure/provider/prisma-provider-profile.repository.ts.
export interface ProviderProfileRepository {
  create(input: CreateProviderProfileInput): Promise<ProviderProfile>;
  findById(id: string): Promise<ProviderProfile | null>;
  findByUserId(userId: string): Promise<ProviderProfile | null>;
  update(id: string, input: UpdateProviderProfileInput): Promise<ProviderProfile>;
  updateLifecycleStatus(id: string, status: AccountLifecycleStatus, details?: { reason?: string }): Promise<void>;
  updateVerificationStatus(id: string, status: VerificationStatus): Promise<void>;
  updateAvailability(id: string, mode: AvailabilityMode, isAvailable: boolean): Promise<void>;
  search(filter: SearchProviderProfilesFilter): Promise<ProviderProfile[]>;
}
