import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { notificationBroadcastRepository } from "@/infrastructure/notification/notification-services";
import { sendBroadcastAction } from "../actions";

export default async function NotificationBroadcastDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
          ← Back to notifications
        </Link>
        <p className="mt-4 text-text-secondary">Broadcast not found.</p>
      </div>
    );
  }

  const boundSend = sendBroadcastAction.bind(null, broadcast.id);

  return (
    <div>
      <Link href="/admin/notifications" className="text-sm text-primary hover:underline">
        ← Back to notifications
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">{broadcast.title}</h1>
        {!broadcast.sentAt && (
          <form action={boundSend}>
            <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
              Send now
            </button>
          </form>
        )}
      </div>

      <div className="mt-6 max-w-xl space-y-4 rounded-card border border-text-disabled/20 bg-surface-light p-6">
        <div>
          <span className="block text-xs font-medium text-text-secondary">Channel</span>
          <span className="text-sm text-text-primary">{broadcast.channel}</span>
        </div>
        <div>
          <span className="block text-xs font-medium text-text-secondary">Body</span>
          <p className="text-sm text-text-primary">{broadcast.body}</p>
        </div>
        <div>
          <span className="block text-xs font-medium text-text-secondary">Status</span>
          <span className={broadcast.status === "PUBLISHED" ? "text-sm text-success" : "text-sm text-text-secondary"}>
            {broadcast.status}
          </span>
        </div>
        <div>
          <span className="block text-xs font-medium text-text-secondary">Sent at</span>
          <span className="text-sm text-text-primary">{broadcast.sentAt ? broadcast.sentAt.toLocaleString() : "Not sent yet"}</span>
        </div>
      </div>
    </div>
  );
}
