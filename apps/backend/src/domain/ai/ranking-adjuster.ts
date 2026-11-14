// Covers both "intelligent provider matching" and "dynamic ranking" — the
// latter is this interface applied continuously, not a second contract.
// Augments the deterministic MatchingStrategy score (docs/06-smart-matching.md
// §3); never bypasses its hard eligibility pre-filters (§4) — a provider
// this interface didn't get to see was never a candidate in the first place.
export interface BaseRankingEntry {
  providerId: string;
  score: number;
}

export interface RankingAdjustment {
  providerId: string;
  adjustedScore: number;
  reason?: string;
}

export interface RankingAdjuster {
  adjust(baseRanking: BaseRankingEntry[], context: Record<string, unknown>): Promise<RankingAdjustment[]>;
}
