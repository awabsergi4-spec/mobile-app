import type { AccountLifecycleStatus, Company, VerificationStatus } from "./company.entity";

export interface CreateCompanyInput {
  ownerId: string;
  name: string;
  regionId: string;
  description?: string;
  logoUrl?: string;
}

export interface UpdateCompanyInput {
  name?: string;
  description?: string;
  logoUrl?: string;
}

export interface SearchCompaniesFilter {
  query?: string; // matches name, case-insensitive
  status?: AccountLifecycleStatus;
  verificationStatus?: VerificationStatus;
  limit?: number;
  cursor?: string;
}

// Interface only — implemented in infrastructure/company/prisma-company.repository.ts.
export interface CompanyRepository {
  create(input: CreateCompanyInput): Promise<Company>;
  findById(id: string): Promise<Company | null>;
  findByOwnerId(ownerId: string): Promise<Company | null>;
  update(id: string, input: UpdateCompanyInput): Promise<Company>;
  updateLifecycleStatus(id: string, status: AccountLifecycleStatus, details?: { reason?: string }): Promise<void>;
  updateVerificationStatus(id: string, status: VerificationStatus): Promise<void>;
  search(filter: SearchCompaniesFilter): Promise<Company[]>;
}
