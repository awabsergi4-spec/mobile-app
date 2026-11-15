import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { adminApi, SahlApiError } from "@/presentation/sahl-api";
import { ACCOUNT_TYPE_LABELS, STATUS_LABELS, type AdminUser } from "../api";
import { approveUserAction, suspendUserAction, reactivateUserAction } from "./actions";

import { getI18n } from "@/presentation/i18n";
export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t, e, dateTime } = await getI18n();
  try {
    await requireAdminPermission("users.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="users.manage" />;
    }
    throw err;
  }

  const { id } = await params;
  let user: AdminUser | null = null;
  try {
    user = await adminApi<AdminUser>(`/admin/users/${id}`);
  } catch (err) {
    if (!(err instanceof SahlApiError && err.status === 404)) throw err;
  }

  if (!user) {
    return (
      <div>
        <Link href="/admin/users" className="text-sm text-primary hover:underline">
          {t("ui.backToUsers")}
        </Link>
        <p className="mt-4 text-text-secondary">{t("ui.userNotFound")}</p>
      </div>
    );
  }

  const boundApprove = approveUserAction.bind(null, user.id);
  const boundSuspend = suspendUserAction.bind(null, user.id);
  const boundReactivate = reactivateUserAction.bind(null, user.id);

  return (
    <div>
      <Link href="/admin/users" className="text-sm text-primary hover:underline">
        {t("ui.backToUsers")}
      </Link>

      <div className="mt-4 rounded-card border border-text-disabled/20 bg-surface-light p-6">
        <h1 className="text-xl font-semibold text-text-primary">{user.fullName}</h1>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-text-secondary">{t("ui.phone")}</dt>
            <dd className="mt-0.5 text-text-primary" dir="ltr">
              {user.phone}
            </dd>
          </div>
          <div>
            <dt className="text-text-secondary">{t("ui.email")}</dt>
            <dd className="mt-0.5 text-text-primary">{user.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">{t("ui.accountType")}</dt>
            <dd className="mt-0.5 text-text-primary">{e("accountType", user.accountType)}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">{t("ui.status")}</dt>
            <dd className="mt-0.5 font-medium text-text-primary">{e("enum", user.status)}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">{t("ui.preferredLanguage")}</dt>
            <dd className="mt-0.5 text-text-primary">{user.preferredLanguage}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">{t("ui.joined")}</dt>
            <dd className="mt-0.5 text-text-primary">{dateTime(user.createdAt)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 rounded-card border border-text-disabled/20 bg-surface-light p-6">
        <h2 className="text-sm font-semibold text-text-primary">{t("ui.accountActions")}</h2>

        {user.status === "PENDING_VERIFICATION" && (
          <div className="mt-3 flex items-center justify-between gap-4 rounded-button border border-warning/40 bg-warning/10 p-4">
            <p className="text-sm text-text-primary">
              {t("ui.thisAccountSignedUpAndIsWaiting")}
            </p>
            <form action={boundApprove}>
              <button type="submit" className="whitespace-nowrap rounded-button bg-success px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                {t("ui.approveAccount")}
              </button>
            </form>
          </div>
        )}

        {user.status === "SUSPENDED" ? (
          <form action={boundReactivate} className="mt-3">
            <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
              {t("ui.reactivateAccount")}
            </button>
          </form>
        ) : user.status === "ACTIVE" || user.status === "PENDING_VERIFICATION" ? (
          <form action={boundSuspend} className="mt-3 flex items-end gap-3">
            <div className="flex-1">
              <label htmlFor="reason" className="block text-xs font-medium text-text-secondary">
                {t("ui.reason")}
              </label>
              <input
                id="reason"
                name="reason"
                required
                minLength={3}
                className="mt-1 w-full rounded-button border border-text-disabled/30 bg-background-light px-3 py-2 text-sm text-text-primary"
                placeholder={user.status === "PENDING_VERIFICATION" ? "Why is this sign-up being rejected?" : "Why is this account being suspended?"}
              />
            </div>
            <button type="submit" className="rounded-button bg-error px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              {user.status === "PENDING_VERIFICATION" ? "Reject (suspend)" : "Suspend account"}
            </button>
          </form>
        ) : (
          <p className="mt-2 text-sm text-text-secondary">{t("ui.thisAccountIsBannedAndHasNo")}</p>
        )}
      </div>
    </div>
  );
}
