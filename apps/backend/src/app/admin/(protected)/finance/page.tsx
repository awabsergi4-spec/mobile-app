import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";

import { getI18n } from "@/presentation/i18n";
export default async function AdminFinancePage() {
  const { t } = await getI18n();
  try {
    await requireAdminPermission("finance.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="finance.manage" />;
    }
    throw err;
  }

  const links = [
    { href: "/admin/finance/withdrawals", label: t("ui.withdrawals"), description: t("ui.approveRejectAndMarkPayoutsAsPaid") },
    { href: "/admin/finance/disputes", label: t("ui.disputes"), description: t("ui.authorizeReleaseRefundSplitForDisputedEscrow") },
    { href: "/admin/finance/settlements", label: t("ui.settlements"), description: t("ui.batchApprovedWithdrawalsForPayout") },
    { href: "/admin/finance/wallets", label: t("ui.walletLookup"), description: t("ui.inspectAWalletSBucketedBalances") },
    { href: "/admin/finance/escrows", label: t("ui.escrowLookup"), description: t("ui.inspectAnEscrowSHeldReleasedRefunded") },
    { href: "/admin/finance/reports", label: t("ui.trialBalanceReconciliation"), description: t("ui.ledgerTruthReportsPerCurrency") },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-text-primary">{t("ui.financialCore")}</h1>
      <p className="mt-1 text-sm text-text-secondary">
        {t("ui.theDoubleEntryLedgerIsTheSource")}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-card border border-text-disabled/20 bg-surface-light p-5 hover:border-primary"
          >
            <p className="text-sm font-semibold text-text-primary">{link.label}</p>
            <p className="mt-1 text-xs text-text-secondary">{link.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
