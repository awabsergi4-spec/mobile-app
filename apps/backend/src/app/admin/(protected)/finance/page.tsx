import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";

export default async function AdminFinancePage() {
  try {
    await requireAdminPermission("finance.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="finance.manage" />;
    }
    throw err;
  }

  const links = [
    { href: "/admin/finance/withdrawals", label: "Withdrawals", description: "Approve, reject, and mark payouts as paid." },
    { href: "/admin/finance/disputes", label: "Disputes", description: "Authorize release/refund/split for disputed escrow." },
    { href: "/admin/finance/settlements", label: "Settlements", description: "Batch approved withdrawals for payout." },
    { href: "/admin/finance/wallets", label: "Wallet lookup", description: "Inspect a wallet's bucketed balances." },
    { href: "/admin/finance/escrows", label: "Escrow lookup", description: "Inspect an escrow's held/released/refunded amounts." },
    { href: "/admin/finance/reports", label: "Trial balance & reconciliation", description: "Ledger-truth reports, per currency." },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-text-primary">Financial Core</h1>
      <p className="mt-1 text-sm text-text-secondary">
        The double-entry ledger is the source of truth — nothing here calculates or mutates a balance directly.
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
