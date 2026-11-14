import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { EmptyState } from "@/presentation/admin-ui/empty-state";
import { notificationBroadcastRepository } from "@/infrastructure/notification/notification-services";
import type { PublishStatus } from "@prisma/client";

const STATUS_OPTIONS: PublishStatus[] = ["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"];

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  try {
    await requireAdminPermission("notifications.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="notifications.manage" />;
    }
    throw err;
  }

  const { status } = await searchParams;
  const broadcasts = await notificationBroadcastRepository.search({ status: (status as PublishStatus) || undefined });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Notifications</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {broadcasts.length} broadcast{broadcasts.length === 1 ? "" : "s"} shown. Delivered as persistent in-app notifications — no
            Firebase required.
          </p>
        </div>
        <Link href="/admin/notifications/new" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
          New broadcast
        </Link>
      </div>

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
        {broadcasts.length === 0 ? (
          <EmptyState message="No broadcasts match this filter." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-text-disabled/20 text-xs uppercase text-text-secondary">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Sent</th>
              </tr>
            </thead>
            <tbody>
              {broadcasts.map((b) => (
                <tr key={b.id} className="border-b border-text-disabled/10 last:border-0 hover:bg-primary/5">
                  <td className="px-4 py-3">
                    <Link href={`/admin/notifications/${b.id}`} className="font-medium text-text-primary hover:text-primary">
                      {b.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{b.channel}</td>
                  <td className="px-4 py-3">
                    <span className={b.status === "PUBLISHED" ? "text-success" : "text-text-secondary"}>{b.status}</span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{b.sentAt ? b.sentAt.toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
