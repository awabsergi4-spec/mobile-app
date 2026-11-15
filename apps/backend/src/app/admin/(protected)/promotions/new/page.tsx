import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { createPromotionAction } from "../actions";

import { getI18n } from "@/presentation/i18n";
export default async function NewPromotionPage() {
  const { t } = await getI18n();
  try {
    await requireAdminPermission("promotions.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="promotions.manage" />;
    }
    throw err;
  }

  return (
    <div>
      <Link href="/admin/promotions" className="text-sm text-primary hover:underline">
        {t("ui.backToPromotions")}
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-text-primary">{t("ui.newPromotion")}</h1>

      <form action={createPromotionAction} className="mt-4 max-w-xl space-y-4 rounded-card border border-text-disabled/20 bg-surface-light p-6">
        <div>
          <label htmlFor="name" className="block text-xs font-medium text-text-secondary">
            {t("ui.name")}
          </label>
          <input
            id="name"
            name="name"
            required
            className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-xs font-medium text-text-secondary">
            {t("ui.description")}
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="discountType" className="block text-xs font-medium text-text-secondary">
              {t("ui.discountType")}
            </label>
            <select
              id="discountType"
              name="discountType"
              className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
            >
              <option value="PERCENTAGE">{t("ui.percentage")}</option>
              <option value="FLAT">{t("ui.flatMinorCurrencyUnits")}</option>
            </select>
          </div>
          <div>
            <label htmlFor="discountValue" className="block text-xs font-medium text-text-secondary">
              {t("ui.discountValue")}
            </label>
            <input
              id="discountValue"
              name="discountValue"
              type="number"
              min={1}
              required
              className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startsAt" className="block text-xs font-medium text-text-secondary">
              {t("ui.starts")}
            </label>
            <input
              id="startsAt"
              name="startsAt"
              type="datetime-local"
              required
              className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
            />
          </div>
          <div>
            <label htmlFor="endsAt" className="block text-xs font-medium text-text-secondary">
              {t("ui.ends")}
            </label>
            <input
              id="endsAt"
              name="endsAt"
              type="datetime-local"
              required
              className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
            />
          </div>
        </div>
        <p className="text-xs text-text-secondary">{t("ui.createdInactivePublishItFromTheDetail")}</p>
        <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
          {t("ui.createPromotion")}
        </button>
      </form>
    </div>
  );
}
