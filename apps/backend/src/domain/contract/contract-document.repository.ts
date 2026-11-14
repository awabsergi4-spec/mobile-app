export interface ContractDocument {
  id: string;
  contractId: string;
  uploaderId: string;
  fileUrl: string;
  version: number;
  createdAt: Date;
}

export interface CreateContractDocumentInput {
  contractId: string;
  uploaderId: string;
  fileUrl: string;
}

// Interface only — implemented in infrastructure/contract/prisma-contract-document.repository.ts.
export interface ContractDocumentRepository {
  create(input: CreateContractDocumentInput): Promise<ContractDocument>;
  listByContractId(contractId: string): Promise<ContractDocument[]>;
  countByContractId(contractId: string): Promise<number>;
}
