import type { CompanyRepository, UpdateCompanyInput } from "@/domain/company/company.repository";
import type { Company } from "@/domain/company/company.entity";
import { CompanyNotFoundError } from "./errors";

export class UpdateCompanyUseCase {
  constructor(private readonly companies: CompanyRepository) {}

  async execute(companyId: string, input: UpdateCompanyInput): Promise<Company> {
    const existing = await this.companies.findById(companyId);
    if (!existing) {
      throw new CompanyNotFoundError();
    }

    return this.companies.update(companyId, input);
  }
}
