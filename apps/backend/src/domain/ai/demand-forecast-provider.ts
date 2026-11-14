// Feeds Phase 2/3 provider-growth and category-expansion decisions
// (docs/00-system-architecture.md "Analytics": search trends, peak hours) —
// a forecast, not a live query, hence the explicit time window.
export interface DemandForecast {
  categoryId: string;
  regionId: string;
  windowStart: Date;
  windowEnd: Date;
  expectedRequestVolume: number;
}

export interface DemandForecastProvider {
  forecast(categoryId: string, regionId: string, windowStart: Date, windowEnd: Date): Promise<DemandForecast>;
}
