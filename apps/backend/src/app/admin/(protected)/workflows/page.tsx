import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { EmptyState } from "@/presentation/admin-ui/empty-state";
import { workflowDefinitionRepository } from "@/infrastructure/workflow/workflow-admin-services";
import type { PublishStatus } from "@prisma/client";

const STATUS_OPTIONS: PublishStatus[] = ["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"];

export default async function AdminWorkflowsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  try {
    await requireAdminPermission("workflows.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="workflows.manage" />;
    }
    throw err;
  }

  const { status } = await searchParams;
  const definitions = await workflowDefinitionRepository.search({ status: (status as PublishStatus) || undefined });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Workflows</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {definitions.length} definition{definitions.length === 1 ? "" : "s"} shown. Orchestrates existing entity state
            machines via DomainEvents — never replaces them.
          </p>
        </div>
        <Link href="/admin/workflows/new" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
          New workflow
        </Link>
      </div>

      <form className="mt-4 flex gap-3" method="GET">
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-button border border-text-disabled/30 bg-surface-light px-3 py-2 text-sm text-text-primary"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
          Filter
        </button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-card border border-text-disabled/20 bg-surface-light">
        {definitions.length === 0 ? (
          <EmptyState message="No workflow definitions match this filter." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-text-disabled/20 text-xs uppercase text-text-secondary">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Trigger event</th>
                <th className="px-4 py-3">Steps</th>
                <th className="px-4 py-3">Version</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {definitions.map((def) => (
                <tr key={def.id} className="border-b border-text-disabled/10 last:border-0 hover:bg-primary/5">
                  <td className="px-4 py-3">
                    <Link href={`/admin/workflows/${def.id}`} className="font-medium text-text-primary hover:text-primary">
                      {def.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{def.triggerEventType}</td>
                  <td className="px-4 py-3 text-text-secondary">{def.steps.length}</td>
                  <td className="px-4 py-3 text-text-secondary">v{def.version}</td>
                  <td className="px-4 py-3">
                    <span className={def.status === "PUBLISHED" ? "text-success" : "text-text-secondary"}>{def.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
