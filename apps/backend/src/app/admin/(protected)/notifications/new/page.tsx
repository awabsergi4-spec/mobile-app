import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { createBroadcastAction } from "../actions";

import { getI18n } from "@/presentation/i18n";
export default async function NewNotificationBroadcastPage() {
  const { t } = await getI18n();
  try {
    await requireAdminPermission("notifications.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="notifications.manage" />;
    }
    throw err;
  }

  return (
    <div>
      <Link href="/admin/notifications" className="text-sm text-primary hover:underline">
        {t("ui.backToNotifications")}
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-text-primary">{t("ui.newBroadcast")}</h1>

      <form action={createBroadcastAction} className="mt-4 max-w-xl space-y-4 rounded-card border border-text-disabled/20 bg-surface-light p-6">
        <div>
          <label htmlFor="channel" className="block text-xs font-medium text-text-secondary">
            {t("ui.channel")}
          </label>
          <select
            id="channel"
            name="channel"
            className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
          >
            <option value="IN_APP">{t("ui.inApp")}</option>
            <option value="POPUP">{t("ui.popup")}</option>
            <option value="FULL_SCREEN_ALERT">{t("ui.fullScreenAlert")}</option>
            <option value="EMERGENCY_BROADCAST">{t("ui.emergencyBroadcast")}</option>
            <option value="PUSH">{t("ui.pushNoPushTransportConfiguredYetDelivers")}</option>
          </select>
        </div>
        <div>
          <label htmlFor="title" className="block text-xs font-medium text-text-secondary">
            {t("ui.title")}
          </label>
          <input
            id="title"
            name="title"
            required
            className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
          />
        </div>
        <div>
          <label htmlFor="body" className="block text-xs font-medium text-text-secondary">
            {t("ui.body")}
          </label>
          <textarea
            id="body"
            name="body"
            rows={4}
            required
            className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
          />
        </div>
        <p className="text-xs text-text-secondary">
          {t("ui.createdAsADraftWithNoTargeting")}
        </p>
        <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
          {t("ui.createBroadcast")}
        </button>
      </form>
    </div>
  );
}
