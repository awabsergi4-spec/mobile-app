import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { workflowInstanceRepository } from "@/infrastructure/workflow/workflow-admin-services";

export default async function WorkflowInstanceDetailPage({
  params,
}: {
  params: Promise<{ id: string; instanceId: string }>;
}) {
  try {
    await requireAdminPermission("workflows.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="workflows.manage" />;
    }
    throw err;
  }

  const { id, instanceId } = await params;
  const instance = await workflowInstanceRepository.findById(instanceId);

  if (!instance) {
    return (
      <div>
        <Link href={`/admin/workflows/${id}`} className="text-sm text-primary hover:underline">
          ← Back to workflow
        </Link>
        <p className="mt-4 text-text-secondary">Workflow instance not found.</p>
      </div>
    );
  }

  return (
    <div>
      <Link href={`/admin/workflows/${id}`} className="text-sm text-primary hover:underline">
        ← Back to workflow
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-text-primary">{instance.workflowDefinitionName}</h1>
      <p className="text-sm text-text-secondary">
        {instance.relatedEntityType} / {instance.relatedEntityId} · started {instance.startedAt.toLocaleString()} ·{" "}
        <span className={instance.status === "FAILED" ? "text-error" : ""}>{instance.status}</span>
      </p>
      {instance.cancelReason && <p className="mt-2 text-sm text-error">Cancelled: {instance.cancelReason}</p>}

      <h2 className="mt-6 text-sm font-semibold text-text-primary">Step executions</h2>
      <div className="mt-2 overflow-x-auto rounded-card border border-text-disabled/20 bg-surface-light">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-text-disabled/20 text-xs uppercase text-text-secondary">
            <tr>
              <th className="px-4 py-3">Step</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Attempt</th>
              <th className="px-4 py-3">Started</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Error</th>
            </tr>
          </thead>
          <tbody>
            {instance.stepExecutions.map((se) => (
              <tr key={se.id} className="border-b border-text-disabled/10 last:border-0">
                <td className="px-4 py-3 font-medium text-text-primary">{se.stepKey}</td>
                <td className="px-4 py-3 text-text-secondary">{se.actionType}</td>
                <td className="px-4 py-3 text-text-secondary">{se.attempt}</td>
                <td className="px-4 py-3 text-text-secondary">{se.startedAt.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={se.status === "FAILED" ? "text-error" : "text-text-secondary"}>{se.status}</span>
                </td>
                <td className="px-4 py-3 text-text-secondary">{se.errorMessage ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
