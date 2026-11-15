import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { EmptyState } from "@/presentation/admin-ui/empty-state";
import { remoteEngagementRepository } from "@/infrastructure/remote/remote-services";
import type { RemoteEngagementStatus } from "@prisma/client";

import { getI18n } from "@/presentation/i18n";
const STATUS_OPTIONS: RemoteEngagementStatus[] = ["ACTIVE", "DELIVERED", "COMPLETED", "CANCELLED"];

export default async function AdminRemoteEngagementsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { t, e, dateTime } = await getI18n();
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
        {t("ui.backToServices")}
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-text-primary">{t("ui.remoteEngagements")}</h1>
      <p className="mt-1 text-sm text-text-secondary">
        {t("count.shown", { n: engagements.length })}
      </p>

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
        {engagements.length === 0 ? (
          <EmptyState message={t("ui.noEngagementsMatchThisFilter")} />
        ) : (
          <table className="w-full text-start text-sm">
            <thead className="border-b border-text-disabled/20 text-xs uppercase text-text-secondary">
              <tr>
                <th className="px-4 py-3">{t("ui.title")}</th>
                <th className="px-4 py-3">{t("ui.status")}</th>
                <th className="px-4 py-3">{t("ui.priceType")}</th>
                <th className="px-4 py-3">{t("ui.amount")}</th>
                <th className="px-4 py-3">{t("ui.created")}</th>
              </tr>
            </thead>
            <tbody>
              {engagements.map((engagement) => (
                <tr key={engagement.id} className="border-b border-text-disabled/10 last:border-0">
                  <td className="px-4 py-3 font-medium text-text-primary">{engagement.title}</td>
                  <td className="px-4 py-3 text-text-secondary">{e("enum", engagement.status)}</td>
                  <td className="px-4 py-3 text-text-secondary">{e("enum", engagement.priceType)}</td>
                  <td className="px-4 py-3 text-text-secondary">{engagement.amount}</td>
                  <td className="px-4 py-3 text-text-secondary">{dateTime(engagement.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
