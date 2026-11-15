import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { notificationBroadcastRepository } from "@/infrastructure/notification/notification-services";
import { sendBroadcastAction } from "../actions";

import { getI18n } from "@/presentation/i18n";
export default async function NotificationBroadcastDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t, e, dateTime } = await getI18n();
  try {
    await requireAdminPermission("notifications.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="notifications.manage" />;
    }
    throw err;
  }

  const { id } = await params;
  const broadcast = await notificationBroadcastRepository.findById(id);

  if (!broadcast) {
    return (
      <div>
        <Link href="/admin/notifications" className="text-sm text-primary hover:underline">
          {t("ui.backToNotifications")}
        </Link>
        <p className="mt-4 text-text-secondary">{t("ui.broadcastNotFound")}</p>
      </div>
    );
  }

  const boundSend = sendBroadcastAction.bind(null, broadcast.id);

  return (
    <div>
      <Link href="/admin/notifications" className="text-sm text-primary hover:underline">
        {t("ui.backToNotifications")}
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">{broadcast.title}</h1>
        {!broadcast.sentAt && (
          <form action={boundSend}>
            <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
              {t("ui.sendNow")}
            </button>
          </form>
        )}
      </div>

      <div className="mt-6 max-w-xl space-y-4 rounded-card border border-text-disabled/20 bg-surface-light p-6">
        <div>
          <span className="block text-xs font-medium text-text-secondary">{t("ui.channel")}</span>
          <span className="text-sm text-text-primary">{e("enum", broadcast.channel)}</span>
        </div>
        <div>
          <span className="block text-xs font-medium text-text-secondary">{t("ui.body")}</span>
          <p className="text-sm text-text-primary">{broadcast.body}</p>
        </div>
        <div>
          <span className="block text-xs font-medium text-text-secondary">{t("ui.status")}</span>
          <span className={broadcast.status === "PUBLISHED" ? "text-sm text-success" : "text-sm text-text-secondary"}>
            {e("enum", broadcast.status)}
          </span>
        </div>
        <div>
          <span className="block text-xs font-medium text-text-secondary">{t("ui.sentAt")}</span>
          <span className="text-sm text-text-primary">{broadcast.sentAt ? dateTime(broadcast.sentAt) : "Not sent yet"}</span>
        </div>
      </div>
    </div>
  );
}
