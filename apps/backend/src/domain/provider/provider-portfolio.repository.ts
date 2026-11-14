export interface ProviderPortfolioItem {
  id: string;
  providerId: string;
  title: string | null;
  description: string | null;
  mediaUrl: string;
  createdAt: Date;
}

export interface CreateProviderPortfolioItemInput {
  providerId: string;
  mediaUrl: string;
  title?: string;
  description?: string;
}

// Interface only — implemented in infrastructure/provider/prisma-provider-portfolio.repository.ts.
export interface ProviderPortfolioRepository {
  create(input: CreateProviderPortfolioItemInput): Promise<ProviderPortfolioItem>;
  findById(id: string): Promise<ProviderPortfolioItem | null>;
  listByProviderId(providerId: string): Promise<ProviderPortfolioItem[]>;
  delete(id: string): Promise<void>;
}
