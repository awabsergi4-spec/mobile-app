export interface ProviderMatchCandidate {
  providerId: string;
  score: number;
  distanceKm: number;
}

export interface FindCandidatesInput {
  requestId: string;
  categoryId: string;
  lat: number;
  lng: number;
  excludeProviderIds?: string[];
  limit?: number;
}

// Abstraction over the matching engine (docs/06-smart-matching.md) so
// on-demand dispatch use cases don't hardcode a scoring algorithm.
// infrastructure/on-demand/distance-rating-provider-matcher.ts is the v1
// rule-based implementation (distance + rating); a learned RankingAdjuster
// (ADR-005, Phase 3) can replace it later without touching the use cases
// that consume this interface — same swap-without-rewrite shape as
// domain/ai's capability interfaces.
export interface ProviderMatcher {
  findCandidates(input: FindCandidatesInput): Promise<ProviderMatchCandidate[]>;
}
