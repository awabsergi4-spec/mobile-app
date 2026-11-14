import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { createBroadcastAction } from "../actions";

export default async function NewNotificationBroadcastPage() {
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
        ← Back to notifications
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-text-primary">New broadcast</h1>

      <form action={createBroadcastAction} className="mt-4 max-w-xl space-y-4 rounded-card border border-text-disabled/20 bg-surface-light p-6">
        <div>
          <label htmlFor="channel" className="block text-xs font-medium text-text-secondary">
            Channel
          </label>
          <select
            id="channel"
            name="channel"
            className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
          >
            <option value="IN_APP">In-app</option>
            <option value="POPUP">Popup</option>
            <option value="FULL_SCREEN_ALERT">Full-screen alert</option>
            <option value="EMERGENCY_BROADCAST">Emergency broadcast</option>
            <option value="PUSH">Push (no push transport configured yet — delivers in-app only)</option>
          </select>
        </div>
        <div>
          <label htmlFor="title" className="block text-xs font-medium text-text-secondary">
            Title
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
            Body
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
          Created as a draft with no targeting — sends to every active user. Send it from the detail page once reviewed.
        </p>
        <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
          Create broadcast
        </button>
      </form>
    </div>
  );
}
