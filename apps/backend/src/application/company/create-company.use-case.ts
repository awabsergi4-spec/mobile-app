import type { CompanyRepository, CreateCompanyInput } from "@/domain/company/company.repository";
import type { CompanyMemberRepository } from "@/domain/company/company-member.repository";
import type { Company } from "@/domain/company/company.entity";
import { CompanyAlreadyExistsError } from "./errors";

// Creates the Company and, in the same operation, an OWNER CompanyMember
// row for its owner — so `members` always includes the owner rather than
// treating Company.ownerId as a second, parallel source of membership.
export class CreateCompanyUseCase {
  constructor(
    private readonly companies: CompanyRepository,
    private readonly members: CompanyMemberRepository,
  ) {}

  async execute(input: CreateCompanyInput): Promise<Company> {
    const existing = await this.companies.findByOwnerId(input.ownerId);
    if (existing) {
      throw new CompanyAlreadyExistsError();
    }

    const company = await this.companies.create(input);
    await this.members.add({ companyId: company.id, userId: input.ownerId, role: "OWNER" });

    return company;
  }
}
