import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { EmptyState } from "@/presentation/admin-ui/empty-state";
import { notificationBroadcastRepository } from "@/infrastructure/notification/notification-services";
import type { PublishStatus } from "@prisma/client";

import { getI18n } from "@/presentation/i18n";
const STATUS_OPTIONS: PublishStatus[] = ["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"];

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { t, e, dateTime } = await getI18n();
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
          <h1 className="text-xl font-semibold text-text-primary">{t("ui.notifications")}</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {t("count.broadcasts", { n: broadcasts.length })}
          </p>
        </div>
        <Link href="/admin/notifications/new" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
          {t("ui.newBroadcast")}
        </Link>
      </div>

      <form className="mt-4 flex gap-3" method="GET">
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-button border border-text-disabled/30 bg-surface-light px-3 py-2 text-sm text-text-primary"
        >
          <option value="">{t("ui.allStatuses")}</option>
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
        {broadcasts.length === 0 ? (
          <EmptyState message={t("ui.noBroadcastsMatchThisFilter")} />
        ) : (
          <table className="w-full text-start text-sm">
            <thead className="border-b border-text-disabled/20 text-xs uppercase text-text-secondary">
              <tr>
                <th className="px-4 py-3">{t("ui.title")}</th>
                <th className="px-4 py-3">{t("ui.channel")}</th>
                <th className="px-4 py-3">{t("ui.status")}</th>
                <th className="px-4 py-3">{t("ui.sent")}</th>
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
                  <td className="px-4 py-3 text-text-secondary">{e("enum", b.channel)}</td>
                  <td className="px-4 py-3">
                    <span className={b.status === "PUBLISHED" ? "text-success" : "text-text-secondary"}>{e("enum", b.status)}</span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{b.sentAt ? dateTime(b.sentAt) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
