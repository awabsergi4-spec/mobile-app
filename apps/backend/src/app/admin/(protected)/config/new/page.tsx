import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { listActiveRegions } from "@/infrastructure/remote-config/remote-config-services";
import { createConfigEntryAction } from "../actions";

import { getI18n } from "@/presentation/i18n";
export default async function NewRemoteConfigEntryPage() {
  const { t } = await getI18n();
  try {
    await requireAdminPermission("config.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="config.manage" />;
    }
    throw err;
  }

  const regions = await listActiveRegions();

  return (
    <div>
      <Link href="/admin/config" className="text-sm text-primary hover:underline">
        {t("ui.backToRemoteConfig")}
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-text-primary">{t("ui.newConfigEntry")}</h1>

      <form action={createConfigEntryAction} className="mt-4 max-w-xl space-y-4 rounded-card border border-text-disabled/20 bg-surface-light p-6">
        <div>
          <label htmlFor="key" className="block text-xs font-medium text-text-secondary">
            {t("ui.key")}
          </label>
          <input
            id="key"
            name="key"
            required
            placeholder={t("ui.eGOtpExpirySeconds")}
            className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="valueType" className="block text-xs font-medium text-text-secondary">
              {t("ui.valueType")}
            </label>
            <select
              id="valueType"
              name="valueType"
              className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
            >
              <option value="BOOLEAN">{t("ui.boolean")}</option>
              <option value="NUMBER">{t("ui.number")}</option>
              <option value="STRING">{t("ui.string")}</option>
              <option value="JSON">{t("ui.json")}</option>
            </select>
          </div>
          <div>
            <label htmlFor="regionId" className="block text-xs font-medium text-text-secondary">
              {t("ui.regionOptionalBlankGlobal")}
            </label>
            <select
              id="regionId"
              name="regionId"
              className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
            >
              <option value="">{t("ui.global")}</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.code})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="value" className="block text-xs font-medium text-text-secondary">
            {t("ui.value")}
          </label>
          <input
            id="value"
            name="value"
            required
            placeholder='Boolean: true — Number: 30 — String: text — JSON: {"a":1}'
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
        <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
          {t("ui.createEntry")}
        </button>
      </form>
    </div>
  );
}
