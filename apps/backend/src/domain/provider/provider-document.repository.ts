export type ProviderDocumentStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ProviderDocument {
  id: string;
  providerId: string;
  type: string;
  fileUrl: string;
  status: ProviderDocumentStatus;
  reviewedAt: Date | null;
  createdAt: Date;
}

export interface CreateProviderDocumentInput {
  providerId: string;
  type: string;
  fileUrl: string;
}

// Interface only — implemented in infrastructure/provider/prisma-provider-document.repository.ts.
export interface ProviderDocumentRepository {
  create(input: CreateProviderDocumentInput): Promise<ProviderDocument>;
  findById(id: string): Promise<ProviderDocument | null>;
  listByProviderId(providerId: string): Promise<ProviderDocument[]>;
  countByProviderId(providerId: string): Promise<number>;
  updateStatus(id: string, status: ProviderDocumentStatus): Promise<ProviderDocument>;
}
