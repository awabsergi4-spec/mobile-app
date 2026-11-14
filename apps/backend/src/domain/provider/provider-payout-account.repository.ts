export type WithdrawalMethod = "BANK_TRANSFER" | "WALLET_TRANSFER" | "MOBILE_MONEY";

export interface ProviderPayoutAccount {
  id: string;
  providerId: string;
  method: WithdrawalMethod;
  accountDetails: Record<string, unknown>;
  isDefault: boolean;
  createdAt: Date;
}

export interface CreateProviderPayoutAccountInput {
  providerId: string;
  method: WithdrawalMethod;
  accountDetails: Record<string, unknown>;
  isDefault?: boolean;
}

// Interface only — implemented in infrastructure/provider/prisma-provider-payout-account.repository.ts.
export interface ProviderPayoutAccountRepository {
  create(input: CreateProviderPayoutAccountInput): Promise<ProviderPayoutAccount>;
  findById(id: string): Promise<ProviderPayoutAccount | null>;
  listByProviderId(providerId: string): Promise<ProviderPayoutAccount[]>;
  setDefault(providerId: string, payoutAccountId: string): Promise<void>;
  delete(id: string): Promise<void>;
}
