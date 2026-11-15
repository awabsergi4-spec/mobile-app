import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { StatCard } from "@/presentation/admin-ui/stat-card";
import { formatMoney } from "@/presentation/admin-ui/format-money";
import { financeReportingService } from "@/infrastructure/finance/finance-services";
import { prisma } from "@/infrastructure/prisma-client";

import { getI18n } from "@/presentation/i18n";
export default async function AdminFinanceReportsPage({ searchParams }: { searchParams: Promise<{ currency?: string }> }) {
  const { t, e } = await getI18n();
  try {
    await requireAdminPermission("finance.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="finance.manage" />;
    }
    throw err;
  }

  const { currency: currencyParam } = await searchParams;
  // No hardcoded currency — falls back to whatever the platform's default
  // region is actually configured with.
  const defaultRegion = currencyParam ? null : await prisma.region.findFirst({ where: { isActive: true } });
  const currency = currencyParam || defaultRegion?.defaultCurrency;

  if (!currency) {
    return (
      <div>
        <Link href="/admin/finance" className="text-sm text-primary hover:underline">
          {t("ui.backToFinance")}
        </Link>
        <p className="mt-4 text-text-secondary">{t("ui.noActiveRegionIsConfiguredAndNo")}</p>
      </div>
    );
  }

  const [trialBalance, walletReconciliation, escrowReconciliation] = await Promise.all([
    financeReportingService.getTrialBalance(currency),
    financeReportingService.reconcileWalletBalances(currency),
    financeReportingService.reconcileEscrowHoldings(currency),
  ]);

  const totalDebits = trialBalance.reduce((sum, line) => sum + line.totalDebits, 0);
  const totalCredits = trialBalance.reduce((sum, line) => sum + line.totalCredits, 0);

  return (
    <div>
      <Link href="/admin/finance" className="text-sm text-primary hover:underline">
        {t("ui.backToFinance")}
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-text-primary">{t("ui.trialBalanceReconciliation")}</h1>
      <p className="mt-1 text-sm text-text-secondary">{t("ui.reportsCurrencyNote", { currency })}</p>

      <form className="mt-4 flex gap-3" method="GET">
        <input
          type="text"
          name="currency"
          defaultValue={currency}
          placeholder={t("ui.currencyCodeEGSdg")}
          className="w-40 rounded-button border border-text-disabled/30 bg-surface-light px-3 py-2 text-sm text-text-primary"
        />
        <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
          {t("ui.load")}
        </button>
      </form>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <StatCard
          label={t("stat.walletReconciliation")}
          value={walletReconciliation.isReconciled ? t("ui.reconciled") : formatMoney(walletReconciliation.discrepancy, currency)}
          tone={walletReconciliation.isReconciled ? "default" : "error"}
        />
        <StatCard
          label={t("stat.escrowReconciliation")}
          value={escrowReconciliation.isReconciled ? "Reconciled" : formatMoney(escrowReconciliation.discrepancy, currency)}
          tone={escrowReconciliation.isReconciled ? "default" : "error"}
        />
      </div>

      <div className="mt-6 rounded-card border border-text-disabled/20 bg-surface-light p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">{t("ui.trialBalance")}</h2>
          <span className={totalDebits === totalCredits ? "text-sm text-success" : "text-sm text-error"}>
            {totalDebits === totalCredits ? t("ui.balanced") : t("ui.unbalanced")}
          </span>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead className="border-b border-text-disabled/20 text-xs uppercase text-text-secondary">
              <tr>
                <th className="px-2 py-2">{t("ui.account")}</th>
                <th className="px-2 py-2">{t("ui.type")}</th>
                <th className="px-2 py-2">{t("ui.debits")}</th>
                <th className="px-2 py-2">{t("ui.credits")}</th>
                <th className="px-2 py-2">{t("ui.balance")}</th>
              </tr>
            </thead>
            <tbody>
              {trialBalance.map((line) => (
                <tr key={line.ledgerAccountCode} className="border-b border-text-disabled/10 last:border-0">
                  <td className="px-2 py-2 text-text-primary">{line.ledgerAccountName}</td>
                  <td className="px-2 py-2 text-text-secondary">{e("enum", line.type)}</td>
                  <td className="px-2 py-2 text-text-secondary">{formatMoney(line.totalDebits, currency)}</td>
                  <td className="px-2 py-2 text-text-secondary">{formatMoney(line.totalCredits, currency)}</td>
                  <td className="px-2 py-2 font-medium text-text-primary">{formatMoney(line.balance, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
