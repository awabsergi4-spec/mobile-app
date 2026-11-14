import type {
  ContractDocument,
  ContractDocumentRepository,
  CreateContractDocumentInput,
} from "@/domain/contract/contract-document.repository";
import type { ContractRepository } from "@/domain/contract/contract.repository";
import { ContractNotFoundError } from "./errors";

export class UploadContractDocumentUseCase {
  constructor(
    private readonly contracts: ContractRepository,
    private readonly documents: ContractDocumentRepository,
  ) {}

  async execute(input: CreateContractDocumentInput): Promise<ContractDocument> {
    const contract = await this.contracts.findById(input.contractId);
    if (!contract) {
      throw new ContractNotFoundError();
    }

    return this.documents.create(input);
  }
}
