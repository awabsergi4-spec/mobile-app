// Home-screen "Recommended Providers" / "Popular Services" style surfaces
// (docs/00-ui-ux-design-system.md Home Screen). Distinct from RankingAdjuster:
// this produces a ranked list of things to show a user with no existing
// request in progress, not a ranking over candidates for a specific request.
export interface RecommendedItem {
  entityType: "PROVIDER" | "SERVICE_CATEGORY";
  entityId: string;
  score: number;
  reason?: string;
}

export interface RecommendationProvider {
  recommend(userId: string, context: Record<string, unknown>): Promise<RecommendedItem[]>;
}
