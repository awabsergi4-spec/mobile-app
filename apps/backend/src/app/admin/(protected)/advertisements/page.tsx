import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { EmptyState } from "@/presentation/admin-ui/empty-state";
import { advertisementRepository } from "@/infrastructure/advertisement/advertisement-services";
import type { AdPlacement } from "@prisma/client";

import { getI18n } from "@/presentation/i18n";
const PLACEMENT_OPTIONS: AdPlacement[] = ["SEARCH_TOP", "CATEGORY_BANNER", "PROVIDER_FEATURED"];

export default async function AdminAdvertisementsPage({
  searchParams,
}: {
  searchParams: Promise<{ placement?: string; isActive?: string }>;
}) {
  const { t, e, date } = await getI18n();
  try {
    await requireAdminPermission("advertisements.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="advertisements.manage" />;
    }
    throw err;
  }

  const { placement, isActive } = await searchParams;
  const ads = await advertisementRepository.search({
    placement: (placement as AdPlacement) || undefined,
    isActive: isActive === undefined ? undefined : isActive === "true",
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">{t("ui.advertisements")}</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {t("count.ads", { n: ads.length })}
          </p>
        </div>
        <Link href="/admin/advertisements/new" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
          {t("ui.newAdvertisement")}
        </Link>
      </div>

      <form className="mt-4 flex gap-3" method="GET">
        <select
          name="placement"
          defaultValue={placement ?? ""}
          className="rounded-button border border-text-disabled/30 bg-surface-light px-3 py-2 text-sm text-text-primary"
        >
          <option value="">{t("ui.allPlacements")}</option>
          {PLACEMENT_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {e("enum", p)}
            </option>
          ))}
        </select>
        <select
          name="isActive"
          defaultValue={isActive ?? ""}
          className="rounded-button border border-text-disabled/30 bg-surface-light px-3 py-2 text-sm text-text-primary"
        >
          <option value="">{t("ui.allStatuses")}</option>
          <option value="true">{t("ui.active")}</option>
          <option value="false">{t("ui.inactive")}</option>
        </select>
        <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
          {t("ui.filter")}
        </button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-card border border-text-disabled/20 bg-surface-light">
        {ads.length === 0 ? (
          <EmptyState message={t("ui.noAdvertisementsMatchThisFilter")} />
        ) : (
          <table className="w-full text-start text-sm">
            <thead className="border-b border-text-disabled/20 text-xs uppercase text-text-secondary">
              <tr>
                <th className="px-4 py-3">{t("ui.title")}</th>
                <th className="px-4 py-3">{t("ui.placement")}</th>
                <th className="px-4 py-3">{t("ui.priority")}</th>
                <th className="px-4 py-3">{t("ui.window")}</th>
                <th className="px-4 py-3">{t("ui.status")}</th>
              </tr>
            </thead>
            <tbody>
              {ads.map((ad) => (
                <tr key={ad.id} className="border-b border-text-disabled/10 last:border-0 hover:bg-primary/5">
                  <td className="px-4 py-3">
                    <Link href={`/admin/advertisements/${ad.id}`} className="font-medium text-text-primary hover:text-primary">
                      {ad.title || "(untitled)"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{e("enum", ad.placement)}</td>
                  <td className="px-4 py-3 text-text-secondary">{ad.priority}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {date(ad.startsAt)} – {date(ad.endsAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={ad.isActive ? "text-success" : "text-text-secondary"}>{ad.isActive ? "Active" : "Inactive"}</span>
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
