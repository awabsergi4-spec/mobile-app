import Link from "next/link";
import { cookies } from "next/headers";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { EmptyState } from "@/presentation/admin-ui/empty-state";
import { getI18n } from "@/presentation/i18n";
import { adminApi } from "@/presentation/sahl-api";
import { cancelResetAction, dismissResetCodeAction, issueResetCodeAction } from "./actions";
import {
  RESET_CODE_COOKIE,
  RESET_STATUS_KEYS,
  RESET_TAB_KEYS,
  RESET_TABS,
  type ResetRequest,
  type ResetTab,
} from "./shared";

// Forgot-password requests from the app. The admin generates a 6-digit code,
// sends it to the user (phone call / WhatsApp), and the user enters it in the
// app to set a new password. Data: GET /api/v1/admin/password-resets.
export default async function AdminPasswordResetsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { t, dateTime } = await getI18n();
  try {
    await requireAdminPermission("users.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="users.manage" />;
    }
    throw err;
  }

  const { status } = await searchParams;
  const tab: ResetTab = RESET_TABS.includes(status as ResetTab) ? (status as ResetTab) : "WAITING";
  const { requests, waitingCount } = await adminApi<{ requests: ResetRequest[]; waitingCount: number }>(
    `/admin/password-resets?status=${tab}`,
  );

  const store = await cookies();
  let issued: { requestId: string; code: string; expiresAt: string } | null = null;
  try {
    const raw = store.get(RESET_CODE_COOKIE)?.value;
    issued = raw ? JSON.parse(raw) : null;
  } catch {
    issued = null;
  }
  const issuedFor = issued ? requests.find((r) => r.id === issued!.requestId) : undefined;

  return (
    <div>
      <h1 className="text-xl font-semibold text-text-primary">{t("resets.title")}</h1>
      <p className="mt-1 text-sm text-text-secondary">{t("resets.subtitle")}</p>

      {issued && (
        <div className="mt-4 rounded-card border border-success/40 bg-success/10 p-5">
          <p className="text-sm text-text-primary">
            {t("resets.codeFor", { name: issuedFor?.fullName ?? "—", phone: issuedFor?.phone ?? "" })}
          </p>
          <p className="mt-2 font-mono text-3xl font-semibold tracking-[0.3em] text-text-primary" dir="ltr">
            {issued.code}
          </p>
          <p className="mt-2 text-xs text-text-secondary">
            {t("resets.codeNote", { when: dateTime(issued.expiresAt) })}
          </p>
          <form action={dismissResetCodeAction} className="mt-3">
            <button type="submit" className="text-sm font-medium text-primary hover:underline">
              {t("resets.dismiss")}
            </button>
          </form>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {RESET_TABS.map((s) => (
          <Link
            key={s}
            href={`/admin/password-resets?status=${s}`}
            className={`rounded-button border px-3 py-1.5 ${
              tab === s ? "border-primary bg-primary/10 font-semibold text-primary" : "border-text-disabled/30 text-text-secondary"
            }`}
          >
            {t(RESET_TAB_KEYS[s])}
            {s === "WAITING" && waitingCount > 0 ? ` (${waitingCount})` : ""}
          </Link>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-card border border-text-disabled/20 bg-surface-light">
        {requests.length === 0 ? (
          <EmptyState message={t("resets.empty")} />
        ) : (
          <table className="w-full text-start text-sm">
            <thead className="border-b border-text-disabled/20 text-xs uppercase text-text-secondary">
              <tr>
                <th className="px-4 py-3">{t("resets.user")}</th>
                <th className="px-4 py-3">{t("resets.phone")}</th>
                <th className="px-4 py-3">{t("resets.requested")}</th>
                <th className="px-4 py-3">{t("resets.status")}</th>
                <th className="px-4 py-3">{t("resets.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const open = r.status === "WAITING" || r.status === "CODE_ISSUED";
                return (
                  <tr key={r.id} className="border-b border-text-disabled/10 last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/admin/users/${r.userId}`} className="font-medium text-text-primary hover:text-primary">
                        {r.fullName ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text-secondary" dir="ltr">
                      {r.phone ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{dateTime(r.requestedAt)}</td>
                    <td className="px-4 py-3">
                      <span className={open ? "text-warning" : "text-text-secondary"}>{t(RESET_STATUS_KEYS[r.status])}</span>
                      {r.status === "CODE_ISSUED" && (
                        <span className="block text-xs text-text-secondary">
                          {t("resets.validUntil", { when: dateTime(r.expiresAt) })}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {open && (
                        <div className="flex flex-wrap gap-2">
                          <form action={issueResetCodeAction.bind(null, r.id)}>
                            <button
                              type="submit"
                              className="rounded-button bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-secondary"
                            >
                              {r.status === "WAITING" ? t("resets.generate") : t("resets.regenerate")}
                            </button>
                          </form>
                          <form action={cancelResetAction.bind(null, r.id)}>
                            <button
                              type="submit"
                              className="rounded-button border border-text-disabled/30 px-3 py-1.5 text-sm text-text-secondary hover:border-error hover:text-error"
                            >
                              {t("resets.cancel")}
                            </button>
                          </form>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
