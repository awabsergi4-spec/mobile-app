import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { EmptyState } from "@/presentation/admin-ui/empty-state";
import { promotionRepository } from "@/infrastructure/promotion/promotion-services";

import { getI18n } from "@/presentation/i18n";
export default async function AdminPromotionsPage({
  searchParams,
}: {
  searchParams: Promise<{ isActive?: string }>;
}) {
  const { t, date } = await getI18n();
  try {
    await requireAdminPermission("promotions.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="promotions.manage" />;
    }
    throw err;
  }

  const { isActive } = await searchParams;
  const promotions = await promotionRepository.search({
    isActive: isActive === undefined ? undefined : isActive === "true",
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">{t("ui.promotions")}</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {t("count.ads", { n: promotions.length })}
          </p>
        </div>
        <Link href="/admin/promotions/new" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
          {t("ui.newPromotion")}
        </Link>
      </div>

      <form className="mt-4 flex gap-3" method="GET">
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
        {promotions.length === 0 ? (
          <EmptyState message={t("ui.noPromotionsMatchThisFilter")} />
        ) : (
          <table className="w-full text-start text-sm">
            <thead className="border-b border-text-disabled/20 text-xs uppercase text-text-secondary">
              <tr>
                <th className="px-4 py-3">{t("ui.name")}</th>
                <th className="px-4 py-3">{t("ui.discount")}</th>
                <th className="px-4 py-3">{t("ui.window")}</th>
                <th className="px-4 py-3">{t("ui.status")}</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((promo) => (
                <tr key={promo.id} className="border-b border-text-disabled/10 last:border-0 hover:bg-primary/5">
                  <td className="px-4 py-3">
                    <Link href={`/admin/promotions/${promo.id}`} className="font-medium text-text-primary hover:text-primary">
                      {promo.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {promo.discountType === "PERCENTAGE" ? `${promo.discountValue}%` : t("ui.minorUnits", { n: promo.discountValue })}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {date(promo.startsAt)} – {date(promo.endsAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={promo.isActive ? "text-success" : "text-text-secondary"}>{promo.isActive ? "Active" : "Inactive"}</span>
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
