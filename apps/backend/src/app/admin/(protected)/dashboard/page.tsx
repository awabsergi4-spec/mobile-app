import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { StatCard } from "@/presentation/admin-ui/stat-card";
import { formatMoney } from "@/presentation/admin-ui/format-money";
import { dashboardMetricsService } from "@/infrastructure/admin/admin-services";

// Server Component calling the domain service directly (same process,
// same code path as GET /api/v1/admin/dashboard/metrics) — no HTTP
// round-trip to its own API, same pattern the login page already uses for
// LoginWithPasswordUseCase. Real aggregate queries, nothing fabricated.
export default async function AdminDashboardPage() {
  try {
    await requireAdminPermission("dashboard.view");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="dashboard.view" />;
    }
    throw err;
  }

  const metrics = await dashboardMetricsService.getMetrics();

  return (
    <div>
      <h1 className="text-xl font-semibold text-text-primary">Dashboard</h1>
      <p className="mt-1 text-sm text-text-secondary">Platform overview — live from the database.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total users" value={metrics.totalUsers.toLocaleString()} />
        <StatCard label="Active users" value={metrics.activeUsers.toLocaleString()} />
        <StatCard label="Providers" value={metrics.totalProviders.toLocaleString()} />
        <StatCard label="Verified providers" value={metrics.verifiedProviders.toLocaleString()} />
        <StatCard label="Companies" value={metrics.totalCompanies.toLocaleString()} />
        <StatCard label="Active on-demand requests" value={metrics.activeOnDemandRequests.toLocaleString()} />
        <StatCard label="Completed on-demand requests" value={metrics.completedOnDemandRequests.toLocaleString()} />
        <StatCard label="Active contracts" value={metrics.activeContracts.toLocaleString()} />
        <StatCard label="Completed contracts" value={metrics.completedContracts.toLocaleString()} />
        <StatCard label="Active remote engagements" value={metrics.activeRemoteEngagements.toLocaleString()} />
        <StatCard label="Completed remote engagements" value={metrics.completedRemoteEngagements.toLocaleString()} />
        <StatCard label="Platform revenue (commission)" value={formatMoney(metrics.totalRevenue, metrics.currency)} />
        <StatCard label="Held in escrow" value={formatMoney(metrics.escrowHeldAmount, metrics.currency)} />
        <StatCard
          label="Pending withdrawals"
          value={`${metrics.pendingWithdrawalsCount} · ${formatMoney(metrics.pendingWithdrawalsAmount, metrics.currency)}`}
          tone={metrics.pendingWithdrawalsCount > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Open disputes"
          value={metrics.openDisputesCount.toLocaleString()}
          tone={metrics.openDisputesCount > 0 ? "error" : "default"}
        />
        <StatCard
          label="Provider verification queue"
          value={metrics.providerVerificationQueueCount.toLocaleString()}
          tone={metrics.providerVerificationQueueCount > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Company verification queue"
          value={metrics.companyVerificationQueueCount.toLocaleString()}
          tone={metrics.companyVerificationQueueCount > 0 ? "warning" : "default"}
        />
      </div>
    </div>
  );
}
