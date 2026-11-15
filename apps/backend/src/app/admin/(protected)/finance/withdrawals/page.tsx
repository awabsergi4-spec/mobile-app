import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { EmptyState } from "@/presentation/admin-ui/empty-state";
import { formatMoney } from "@/presentation/admin-ui/format-money";
import { withdrawalRepository } from "@/infrastructure/finance/finance-services";
import type { WithdrawalStatus } from "@prisma/client";

import { getI18n } from "@/presentation/i18n";
const STATUS_OPTIONS: WithdrawalStatus[] = ["REQUESTED", "PENDING_APPROVAL", "APPROVED", "REJECTED", "PROCESSING", "PAID", "FAILED"];

export default async function AdminWithdrawalsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { t, e, dateTime } = await getI18n();
  try {
    await requireAdminPermission("finance.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="finance.manage" />;
    }
    throw err;
  }

  const { status } = await searchParams;
  const activeStatus = (status as WithdrawalStatus) || "REQUESTED";
  const withdrawals = await withdrawalRepository.listByStatus(activeStatus, { limit: 50 });

  return (
    <div>
      <Link href="/admin/finance" className="text-sm text-primary hover:underline">
        {t("ui.backToFinance")}
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-text-primary">{t("ui.withdrawals")}</h1>
      <p className="mt-1 text-sm text-text-secondary">
        {t("count.inStatus", { n: withdrawals.length, status: e("enum", activeStatus) })}
      </p>

      <form className="mt-4 flex gap-3" method="GET">
        <select
          name="status"
          defaultValue={activeStatus}
          className="rounded-button border border-text-disabled/30 bg-surface-light px-3 py-2 text-sm text-text-primary"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {e("enum", s)}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
          {t("ui.filter")}
        </button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-card border border-text-disabled/20 bg-surface-light">
        {withdrawals.length === 0 ? (
          <EmptyState message={t("ui.noWithdrawalsInThisStatus")} />
        ) : (
          <table className="w-full text-start text-sm">
            <thead className="border-b border-text-disabled/20 text-xs uppercase text-text-secondary">
              <tr>
                <th className="px-4 py-3">{t("ui.amount")}</th>
                <th className="px-4 py-3">{t("ui.method")}</th>
                <th className="px-4 py-3">{t("ui.status")}</th>
                <th className="px-4 py-3">{t("ui.requested")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => (
                <tr key={w.id} className="border-b border-text-disabled/10 last:border-0">
                  <td className="px-4 py-3 font-medium text-text-primary">{formatMoney(w.amount + w.feeMinorUnits, w.currency)}</td>
                  <td className="px-4 py-3 text-text-secondary">{e("enum", w.method)}</td>
                  <td className="px-4 py-3 text-text-secondary">{e("enum", w.status)}</td>
                  <td className="px-4 py-3 text-text-secondary">{dateTime(w.requestedAt)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/finance/withdrawals/${w.id}`} className="text-primary hover:underline">
                      {t("ui.review")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
