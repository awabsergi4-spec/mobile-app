import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { EmptyState } from "@/presentation/admin-ui/empty-state";
import { disputeRepository } from "@/infrastructure/dispute/dispute-services";
import type { DisputeStatus } from "@prisma/client";

const STATUS_OPTIONS: DisputeStatus[] = ["OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"];

export default async function AdminDisputesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  try {
    await requireAdminPermission("finance.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="finance.manage" />;
    }
    throw err;
  }

  const { status } = await searchParams;
  const activeStatus = (status as DisputeStatus) || "OPEN";
  const disputes = await disputeRepository.listByStatus(activeStatus, { limit: 50 });

  return (
    <div>
      <Link href="/admin/finance" className="text-sm text-primary hover:underline">
        ← Back to finance
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-text-primary">Disputes</h1>
      <p className="mt-1 text-sm text-text-secondary">
        {disputes.length} dispute{disputes.length === 1 ? "" : "s"} in {activeStatus}.
      </p>

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
        {disputes.length === 0 ? (
          <EmptyState message="No disputes in this status." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-text-disabled/20 text-xs uppercase text-text-secondary">
              <tr>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {disputes.map((dispute) => (
                <tr key={dispute.id} className="border-b border-text-disabled/10 last:border-0">
                  <td className="px-4 py-3 font-medium text-text-primary">{dispute.relatedEntityType}</td>
                  <td className="px-4 py-3 text-text-secondary">{dispute.reason}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/finance/disputes/${dispute.id}`} className="text-primary hover:underline">
                      Resolve
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
