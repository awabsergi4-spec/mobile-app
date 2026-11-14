// Advisory only — a suggestion surfaced to a provider setting
// ProviderCategory.priceMin/Max or quoting an OnDemandAssignment, never an
// auto-applied price. Amount follows the same minor-units + currency
// convention as every other money field (docs/03-database-schema.md §1).
export interface PricingSuggestion {
  suggestedMinorUnits: number;
  currency: string;
  confidence: number; // 0..1
  rationale?: string;
}

export interface PricingSuggestionProvider {
  suggest(categoryId: string, regionId: string, context: Record<string, unknown>): Promise<PricingSuggestion>;
}
