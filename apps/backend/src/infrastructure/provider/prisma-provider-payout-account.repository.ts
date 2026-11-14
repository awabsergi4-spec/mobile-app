import type { Prisma, PrismaClient } from "@prisma/client";
import type {
  ProviderPayoutAccount,
  ProviderPayoutAccountRepository,
  CreateProviderPayoutAccountInput,
} from "@/domain/provider/provider-payout-account.repository";

export class PrismaProviderPayoutAccountRepository implements ProviderPayoutAccountRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateProviderPayoutAccountInput): Promise<ProviderPayoutAccount> {
    if (input.isDefault) {
      await this.prisma.providerPayoutAccount.updateMany({
        where: { providerId: input.providerId },
        data: { isDefault: false },
      });
    }

    return this.prisma.providerPayoutAccount.create({
      data: {
        providerId: input.providerId,
        method: input.method,
        accountDetails: input.accountDetails as Prisma.InputJsonValue,
        isDefault: input.isDefault ?? false,
      },
    }) as unknown as Promise<ProviderPayoutAccount>;
  }

  async findById(id: string): Promise<ProviderPayoutAccount | null> {
    return this.prisma.providerPayoutAccount.findUnique({ where: { id } }) as unknown as Promise<ProviderPayoutAccount | null>;
  }

  async listByProviderId(providerId: string): Promise<ProviderPayoutAccount[]> {
    return this.prisma.providerPayoutAccount.findMany({
      where: { providerId },
      orderBy: { createdAt: "desc" },
    }) as unknown as Promise<ProviderPayoutAccount[]>;
  }

  async setDefault(providerId: string, payoutAccountId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.providerPayoutAccount.updateMany({
        where: { providerId },
        data: { isDefault: false },
      }),
      this.prisma.providerPayoutAccount.update({
        where: { id: payoutAccountId },
        data: { isDefault: true },
      }),
    ]);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.providerPayoutAccount.delete({ where: { id } });
  }
}
