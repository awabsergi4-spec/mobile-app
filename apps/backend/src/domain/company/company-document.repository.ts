// Mirrors domain/provider/provider-document.repository.ts deliberately —
// same shape, separate interface, per the schema's documented decision to
// keep CompanyDocument/ProviderDocument as independent aggregate roots
// rather than one polymorphic table.
export type CompanyDocumentStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface CompanyDocument {
  id: string;
  companyId: string;
  type: string;
  fileUrl: string;
  status: CompanyDocumentStatus;
  reviewedAt: Date | null;
  createdAt: Date;
}

export interface CreateCompanyDocumentInput {
  companyId: string;
  type: string;
  fileUrl: string;
}

// Interface only — implemented in infrastructure/company/prisma-company-document.repository.ts.
export interface CompanyDocumentRepository {
  create(input: CreateCompanyDocumentInput): Promise<CompanyDocument>;
  findById(id: string): Promise<CompanyDocument | null>;
  listByCompanyId(companyId: string): Promise<CompanyDocument[]>;
  countByCompanyId(companyId: string): Promise<number>;
  updateStatus(id: string, status: CompanyDocumentStatus): Promise<CompanyDocument>;
}
