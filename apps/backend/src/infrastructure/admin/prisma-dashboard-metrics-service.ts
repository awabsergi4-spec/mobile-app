import type { PrismaClient } from "@prisma/client";
import type { DashboardMetrics, DashboardMetricsService } from "@/domain/admin/dashboard-metrics-service";
import type { LedgerService } from "@/domain/finance/ledger-service";

const ACTIVE_ON_DEMAND_STATUSES = ["SEARCHING", "ASSIGNED", "EN_ROUTE", "IN_PROGRESS"] as const;
const OPEN_DISPUTE_STATUSES = ["OPEN", "UNDER_REVIEW"] as const;
const PENDING_WITHDRAWAL_STATUSES = ["REQUESTED", "PENDING_APPROVAL"] as const;

// Every count/sum here reads an existing model directly — nothing is
// recomputed or cached. Revenue/escrow figures come from the double-entry
// ledger itself (via LedgerService.getAccountBalance), never from a
// second, dashboard-local calculation.
export class PrismaDashboardMetricsService implements DashboardMetricsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ledger: LedgerService,
  ) {}

  async getMetrics(): Promise<DashboardMetrics> {
    const [
      totalUsers,
      activeUsers,
      totalProviders,
      verifiedProviders,
      totalCompanies,
      activeOnDemandRequests,
      completedOnDemandRequests,
      activeContracts,
      completedContracts,
      activeRemoteEngagements,
      completedRemoteEngagements,
      openDisputesCount,
      providerVerificationQueueCount,
      companyVerificationQueueCount,
      pendingWithdrawals,
      commissionRevenue,
      escrowHolding,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: "ACTIVE" } }),
      this.prisma.providerProfile.count(),
      this.prisma.providerProfile.count({ where: { verificationStatus: "VERIFIED" } }),
      this.prisma.company.count(),
      this.prisma.onDemandRequest.count({ where: { status: { in: [...ACTIVE_ON_DEMAND_STATUSES] } } }),
      this.prisma.onDemandRequest.count({ where: { status: "COMPLETED" } }),
      this.prisma.contract.count({ where: { status: "IN_PROGRESS" } }),
      this.prisma.contract.count({ where: { status: "COMPLETED" } }),
      this.prisma.remoteEngagement.count({ where: { status: "ACTIVE" } }),
      this.prisma.remoteEngagement.count({ where: { status: "COMPLETED" } }),
      this.prisma.dispute.count({ where: { status: { in: [...OPEN_DISPUTE_STATUSES] } } }),
      this.prisma.providerProfile.count({ where: { verificationStatus: "PENDING_REVIEW" } }),
      this.prisma.company.count({ where: { verificationStatus: "PENDING_REVIEW" } }),
      this.prisma.withdrawal.aggregate({
        where: { status: { in: [...PENDING_WITHDRAWAL_STATUSES] } },
        _count: true,
        _sum: { amount: true, feeMinorUnits: true },
      }),
      this.ledger.getAccountBalance("COMMISSION_REVENUE"),
      this.ledger.getAccountBalance("ESCROW_HOLDING"),
    ]);

    const pendingWithdrawalsAmount = (pendingWithdrawals._sum.amount ?? 0) + (pendingWithdrawals._sum.feeMinorUnits ?? 0);

    return {
      currency: commissionRevenue.currency,
      totalUsers,
      activeUsers,
      totalProviders,
      verifiedProviders,
      totalCompanies,
      activeOnDemandRequests,
      completedOnDemandRequests,
      activeContracts,
      completedContracts,
      activeRemoteEngagements,
      completedRemoteEngagements,
      totalRevenue: commissionRevenue.balance,
      escrowHeldAmount: escrowHolding.balance,
      pendingWithdrawalsCount: pendingWithdrawals._count,
      pendingWithdrawalsAmount,
      openDisputesCount,
      providerVerificationQueueCount,
      companyVerificationQueueCount,
    };
  }
}
