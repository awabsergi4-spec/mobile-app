import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { StatCard } from "@/presentation/admin-ui/stat-card";
import { formatMoney } from "@/presentation/admin-ui/format-money";
import { dashboardMetricsService } from "@/infrastructure/admin/admin-services";

import { getI18n } from "@/presentation/i18n";
// Server Component calling the domain service directly (same process,
// same code path as GET /api/v1/admin/dashboard/metrics) — no HTTP
// round-trip to its own API, same pattern the login page already uses for
// LoginWithPasswordUseCase. Real aggregate queries, nothing fabricated.
export default async function AdminDashboardPage() {
  const { t, number } = await getI18n();
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
      <h1 className="text-xl font-semibold text-text-primary">{t("ui.dashboard")}</h1>
      <p className="mt-1 text-sm text-text-secondary">{t("ui.platformOverviewLiveFromTheDatabase")}</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label={t("stat.totalUsers")} value={number(metrics.totalUsers)} />
        <StatCard label={t("stat.activeUsers")} value={number(metrics.activeUsers)} />
        <StatCard label={t("stat.providers")} value={number(metrics.totalProviders)} />
        <StatCard label={t("stat.verifiedProviders")} value={number(metrics.verifiedProviders)} />
        <StatCard label={t("stat.companies")} value={number(metrics.totalCompanies)} />
        <StatCard label={t("stat.activeOnDemand")} value={number(metrics.activeOnDemandRequests)} />
        <StatCard label={t("stat.completedOnDemand")} value={number(metrics.completedOnDemandRequests)} />
        <StatCard label={t("stat.activeContracts")} value={number(metrics.activeContracts)} />
        <StatCard label={t("stat.completedContracts")} value={number(metrics.completedContracts)} />
        <StatCard label={t("stat.activeRemote")} value={number(metrics.activeRemoteEngagements)} />
        <StatCard label={t("stat.completedRemote")} value={number(metrics.completedRemoteEngagements)} />
        <StatCard label={t("stat.revenue")} value={formatMoney(metrics.totalRevenue, metrics.currency)} />
        <StatCard label={t("stat.heldInEscrow")} value={formatMoney(metrics.escrowHeldAmount, metrics.currency)} />
        <StatCard
          label={t("stat.pendingWithdrawals")}
          value={`${metrics.pendingWithdrawalsCount} · ${formatMoney(metrics.pendingWithdrawalsAmount, metrics.currency)}`}
          tone={metrics.pendingWithdrawalsCount > 0 ? "warning" : "default"}
        />
        <StatCard
          label={t("stat.openDisputes")}
          value={number(metrics.openDisputesCount)}
          tone={metrics.openDisputesCount > 0 ? "error" : "default"}
        />
        <StatCard
          label={t("stat.providerQueue")}
          value={number(metrics.providerVerificationQueueCount)}
          tone={metrics.providerVerificationQueueCount > 0 ? "warning" : "default"}
        />
        <StatCard
          label={t("stat.companyQueue")}
          value={number(metrics.companyVerificationQueueCount)}
          tone={metrics.companyVerificationQueueCount > 0 ? "warning" : "default"}
        />
      </div>
    </div>
  );
}
