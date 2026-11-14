import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { EmptyState } from "@/presentation/admin-ui/empty-state";
import { adminApi } from "@/presentation/sahl-api";
import { ACCOUNT_TYPE_LABELS, STATUS_LABELS, type AdminUserList, type AdminUserStatus } from "./api";

const STATUS_OPTIONS = Object.keys(STATUS_LABELS) as AdminUserStatus[];

// Data comes from the SAHL API (GET /api/v1/admin/users).
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; status?: string }>;
}) {
  try {
    await requireAdminPermission("users.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="users.manage" />;
    }
    throw err;
  }

  const { query, status } = await searchParams;
  const params = new URLSearchParams({ limit: "50" });
  if (query) params.set("query", query);
  if (status) params.set("status", status);
  const { users, pendingApprovalCount } = await adminApi<AdminUserList>(`/admin/users?${params.toString()}`);

  return (
    <div>
      <h1 className="text-xl font-semibold text-text-primary">Users</h1>
      <p className="mt-1 text-sm text-text-secondary">{users.length} account{users.length === 1 ? "" : "s"} shown.</p>

      {pendingApprovalCount > 0 && status !== "PENDING_VERIFICATION" && (
        <Link
          href="/admin/users?status=PENDING_VERIFICATION"
          className="mt-4 flex items-center justify-between rounded-card border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-text-primary hover:border-warning"
        >
          <span>
            <strong>{pendingApprovalCount}</strong> new account{pendingApprovalCount === 1 ? "" : "s"} waiting for approval
          </span>
          <span className="font-medium text-primary">Review →</span>
        </Link>
      )}

      <form className="mt-4 flex flex-wrap gap-3" method="GET">
        <input
          type="text"
          name="query"
          defaultValue={query}
          placeholder="Search phone or name…"
          className="w-64 rounded-button border border-text-disabled/30 bg-surface-light px-3 py-2 text-sm text-text-primary"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-button border border-text-disabled/30 bg-surface-light px-3 py-2 text-sm text-text-primary"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
          Search
        </button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-card border border-text-disabled/20 bg-surface-light">
        {users.length === 0 ? (
          <EmptyState message="No users match this search." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-text-disabled/20 text-xs uppercase text-text-secondary">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-text-disabled/10 last:border-0 hover:bg-primary/5">
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${user.id}`} className="font-medium text-text-primary hover:text-primary">
                      {user.fullName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-secondary" dir="ltr">
                    {user.phone}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{ACCOUNT_TYPE_LABELS[user.accountType]}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        user.status === "ACTIVE"
                          ? "text-success"
                          : user.status === "SUSPENDED" || user.status === "BANNED"
                            ? "text-error"
                            : "text-warning"
                      }
                    >
                      {STATUS_LABELS[user.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
