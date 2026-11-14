// Interface only — implemented in infrastructure/admin/prisma-dashboard-metrics-service.ts.
// Read-only aggregation over existing models; never a second source of
// truth for anything the Financial Core/Provider/Company modules already
// own (revenue/escrow numbers are read straight off the ledger, not
// recomputed here).
export interface DashboardMetrics {
  currency: string;
  totalUsers: number;
  activeUsers: number;
  totalProviders: number;
  verifiedProviders: number;
  totalCompanies: number;
  activeOnDemandRequests: number;
  completedOnDemandRequests: number;
  activeContracts: number;
  completedContracts: number;
  activeRemoteEngagements: number;
  completedRemoteEngagements: number;
  totalRevenue: number;
  escrowHeldAmount: number;
  pendingWithdrawalsCount: number;
  pendingWithdrawalsAmount: number;
  openDisputesCount: number;
  providerVerificationQueueCount: number;
  companyVerificationQueueCount: number;
}

export interface DashboardMetricsService {
  getMetrics(): Promise<DashboardMetrics>;
}
