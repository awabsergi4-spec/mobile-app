import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { EmptyState } from "@/presentation/admin-ui/empty-state";
import { remoteEngagementRepository } from "@/infrastructure/remote/remote-services";
import type { RemoteEngagementStatus } from "@prisma/client";

const STATUS_OPTIONS: RemoteEngagementStatus[] = ["ACTIVE", "DELIVERED", "COMPLETED", "CANCELLED"];

export default async function AdminRemoteEngagementsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  try {
    await requireAdminPermission("services.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="services.manage" />;
    }
    throw err;
  }

  const { status } = await searchParams;
  const engagements = await remoteEngagementRepository.search({ status: (status as RemoteEngagementStatus) || undefined, limit: 50 });

  return (
    <div>
      <Link href="/admin/services" className="text-sm text-primary hover:underline">
        ← Back to services
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-text-primary">Remote engagements</h1>
      <p className="mt-1 text-sm text-text-secondary">
        {engagements.length} engagement{engagements.length === 1 ? "" : "s"} shown.
      </p>

      <form className="mt-4 flex gap-3" method="GET">
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-button border border-text-disabled/30 bg-surface-light px-3 py-2 text-sm text-text-primary"
        >
          <option value="">All statuses</option>
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
        {engagements.length === 0 ? (
          <EmptyState message="No engagements match this filter." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-text-disabled/20 text-xs uppercase text-text-secondary">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Price type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {engagements.map((engagement) => (
                <tr key={engagement.id} className="border-b border-text-disabled/10 last:border-0">
                  <td className="px-4 py-3 font-medium text-text-primary">{engagement.title}</td>
                  <td className="px-4 py-3 text-text-secondary">{engagement.status}</td>
                  <td className="px-4 py-3 text-text-secondary">{engagement.priceType}</td>
                  <td className="px-4 py-3 text-text-secondary">{engagement.amount}</td>
                  <td className="px-4 py-3 text-text-secondary">{engagement.createdAt.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
