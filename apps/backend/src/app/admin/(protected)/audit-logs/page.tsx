import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { EmptyState } from "@/presentation/admin-ui/empty-state";
import { auditLogReader } from "@/infrastructure/audit/audit-services";

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ actorId?: string; entityType?: string; entityId?: string; action?: string }>;
}) {
  try {
    await requireAdminPermission("audit.view");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="audit.view" />;
    }
    throw err;
  }

  const { actorId, entityType, entityId, action } = await searchParams;
  const entries = await auditLogReader.search({ actorId, entityType, entityId, action, limit: 100 });

  return (
    <div>
      <h1 className="text-xl font-semibold text-text-primary">Audit Logs</h1>
      <p className="mt-1 text-sm text-text-secondary">
        {entries.length} entr{entries.length === 1 ? "y" : "ies"} shown. Every privileged admin mutation is recorded here —
        append-only, never edited or deleted.
      </p>

      <form className="mt-4 grid grid-cols-4 gap-3" method="GET">
        <input
          name="actorId"
          defaultValue={actorId ?? ""}
          placeholder="Actor ID"
          className="rounded-button border border-text-disabled/30 bg-surface-light px-3 py-2 text-sm text-text-primary"
        />
        <input
          name="entityType"
          defaultValue={entityType ?? ""}
          placeholder="Entity type (e.g. Advertisement)"
          className="rounded-button border border-text-disabled/30 bg-surface-light px-3 py-2 text-sm text-text-primary"
        />
        <input
          name="entityId"
          defaultValue={entityId ?? ""}
          placeholder="Entity ID"
          className="rounded-button border border-text-disabled/30 bg-surface-light px-3 py-2 text-sm text-text-primary"
        />
        <input
          name="action"
          defaultValue={action ?? ""}
          placeholder="Action contains…"
          className="rounded-button border border-text-disabled/30 bg-surface-light px-3 py-2 text-sm text-text-primary"
        />
        <button
          type="submit"
          className="col-span-4 rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary sm:col-span-1"
        >
          Filter
        </button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-card border border-text-disabled/20 bg-surface-light">
        {entries.length === 0 ? (
          <EmptyState message="No audit log entries match this filter." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-text-disabled/20 text-xs uppercase text-text-secondary">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-text-disabled/10 last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap text-text-secondary">{entry.createdAt.toLocaleString()}</td>
                  <td className="px-4 py-3 text-text-secondary">{entry.actorId ?? "system"}</td>
                  <td className="px-4 py-3 font-medium text-text-primary">{entry.action}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {entry.entityType} / {entry.entityId}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{entry.ipAddress ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
