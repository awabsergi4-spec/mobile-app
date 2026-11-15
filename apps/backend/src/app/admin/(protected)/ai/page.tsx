import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { aiFeatureToggleRepository } from "@/infrastructure/ai/ai-feature-toggle-services";
import { setAiFeatureToggleAction } from "./actions";

import { getI18n } from "@/presentation/i18n";

export default async function AdminAiPage() {
  const { t, e, dateTime } = await getI18n();
  try {
    await requireAdminPermission("ai.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="ai.manage" />;
    }
    throw err;
  }

  const toggles = await aiFeatureToggleRepository.listAll();

  return (
    <div>
      <h1 className="text-xl font-semibold text-text-primary">{t("ui.aiFeatures")}</h1>
      <p className="mt-1 text-sm text-text-secondary">
        {t("ui.disabledOrUnconfiguredCapabilitiesFallBackTo")}
      </p>

      <div className="mt-4 space-y-3">
        {toggles.map((toggle) => {
          const boundSet = setAiFeatureToggleAction.bind(null, toggle.capability);
          return (
            <form
              key={toggle.capability}
              action={boundSet}
              className="flex items-center justify-between gap-4 rounded-card border border-text-disabled/20 bg-surface-light p-4"
            >
              <div>
                <p className="text-sm font-medium text-text-primary">{e("capability", toggle.capability)}</p>
                <p className="text-xs text-text-secondary">
                  {toggle.isEnabled ? t("ui.enabled") : t("ui.disabled")} · {t("ui.providerLabel", { name: toggle.provider })}
                  {toggle.updatedAt ? ` · ${t("ui.updatedAt", { when: dateTime(toggle.updatedAt) })}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  name="provider"
                  defaultValue={toggle.provider}
                  className="w-40 rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
                />
                <label className="flex items-center gap-2 text-sm text-text-primary">
                  <input type="checkbox" name="isEnabled" defaultChecked={toggle.isEnabled} />
                  {t("ui.enabled")}
                </label>
                <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
                  {t("ui.save")}
                </button>
              </div>
            </form>
          );
        })}
      </div>
    </div>
  );
}
