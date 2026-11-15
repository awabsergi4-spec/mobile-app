import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { EmptyState } from "@/presentation/admin-ui/empty-state";
import { onDemandRequestRepository } from "@/infrastructure/on-demand/on-demand-services";
import type { OnDemandStatus } from "@prisma/client";

import { getI18n } from "@/presentation/i18n";
const STATUS_OPTIONS: OnDemandStatus[] = ["SEARCHING", "ASSIGNED", "EN_ROUTE", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

export default async function AdminOnDemandPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
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
  const requests = await onDemandRequestRepository.search({ status: (status as OnDemandStatus) || undefined, limit: 50 });

  return (
    <div>
      <Link href="/admin/services" className="text-sm text-primary hover:underline">
        {t("ui.backToServices")}
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-text-primary">{t("ui.onDemandRequests")}</h1>
      <p className="mt-1 text-sm text-text-secondary">
        {t("count.shown", { n: requests.length })}
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
        {requests.length === 0 ? (
          <EmptyState message={t("ui.noRequestsMatchThisFilter")} />
        ) : (
          <table className="w-full text-start text-sm">
            <thead className="border-b border-text-disabled/20 text-xs uppercase text-text-secondary">
              <tr>
                <th className="px-4 py-3">{t("ui.status")}</th>
                <th className="px-4 py-3">{t("ui.fulfillment")}</th>
                <th className="px-4 py-3">{t("ui.emergency")}</th>
                <th className="px-4 py-3">{t("ui.created")}</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="border-b border-text-disabled/10 last:border-0">
                  <td className="px-4 py-3 font-medium text-text-primary">{e("enum", request.status)}</td>
                  <td className="px-4 py-3 text-text-secondary">{e("enum", request.fulfillmentMode)}</td>
                  <td className="px-4 py-3">
                    {request.isEmergency ? <span className="text-error">{t("ui.emergency")}</span> : <span className="text-text-secondary">—</span>}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{dateTime(request.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
