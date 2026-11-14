import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { EmptyState } from "@/presentation/admin-ui/empty-state";
import { formatMoney } from "@/presentation/admin-ui/format-money";
import { settlementRepository } from "@/infrastructure/finance/finance-services";
import { createSettlementAction, completeSettlementAction } from "./actions";
import type { SettlementSchedule, SettlementStatus } from "@prisma/client";

const STATUS_OPTIONS: SettlementStatus[] = ["PENDING", "PROCESSING", "COMPLETED", "FAILED"];
const SCHEDULE_OPTIONS: SettlementSchedule[] = ["INSTANT", "DAILY", "WEEKLY", "MONTHLY", "MANUAL"];

export default async function AdminSettlementsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  try {
    await requireAdminPermission("finance.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="finance.manage" />;
    }
    throw err;
  }

  const { status } = await searchParams;
  const activeStatus = (status as SettlementStatus) || "PENDING";
  const settlements = await settlementRepository.listByStatus(activeStatus, { limit: 50 });

  return (
    <div>
      <Link href="/admin/finance" className="text-sm text-primary hover:underline">
        ← Back to finance
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-text-primary">Settlements</h1>
      <p className="mt-1 text-sm text-text-secondary">A batch run over every currently-APPROVED withdrawal in one currency.</p>

      <div className="mt-4 rounded-card border border-text-disabled/20 bg-surface-light p-6">
        <h2 className="text-sm font-semibold text-text-primary">Create a settlement batch</h2>
        <form action={createSettlementAction} className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="schedule" className="block text-xs font-medium text-text-secondary">
              Schedule
            </label>
            <select
              id="schedule"
              name="schedule"
              defaultValue="MANUAL"
              className="mt-1 rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
            >
              {SCHEDULE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="currency" className="block text-xs font-medium text-text-secondary">
              Currency
            </label>
            <input
              id="currency"
              name="currency"
              required
              maxLength={3}
              minLength={3}
              placeholder="SDG"
              className="mt-1 w-24 rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm uppercase text-text-primary"
            />
          </div>
          <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
            Batch approved withdrawals
          </button>
        </form>
      </div>

      <form className="mt-4 flex gap-3" method="GET">
        <select
          name="status"
          defaultValue={activeStatus}
          className="rounded-button border border-text-disabled/30 bg-surface-light px-3 py-2 text-sm text-text-primary"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
          Filter
        </button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-card border border-text-disabled/20 bg-surface-light">
        {settlements.length === 0 ? (
          <EmptyState message="No settlements in this status." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-text-disabled/20 text-xs uppercase text-text-secondary">
              <tr>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Schedule</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {settlements.map((settlement) => {
                const boundComplete = completeSettlementAction.bind(null, settlement.id);
                return (
                  <tr key={settlement.id} className="border-b border-text-disabled/10 last:border-0">
                    <td className="px-4 py-3 font-medium text-text-primary">{formatMoney(settlement.totalAmount, settlement.currency)}</td>
                    <td className="px-4 py-3 text-text-secondary">{settlement.schedule}</td>
                    <td className="px-4 py-3 text-text-secondary">{settlement.status}</td>
                    <td className="px-4 py-3">
                      {(settlement.status === "PENDING" || settlement.status === "PROCESSING") && (
                        <form action={boundComplete}>
                          <button type="submit" className="text-primary hover:underline">
                            Complete
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
