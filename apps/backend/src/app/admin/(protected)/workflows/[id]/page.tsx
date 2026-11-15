import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { EmptyState } from "@/presentation/admin-ui/empty-state";
import { workflowDefinitionRepository, workflowInstanceRepository } from "@/infrastructure/workflow/workflow-admin-services";
import { setWorkflowDefinitionStatusAction } from "../actions";

import { getI18n } from "@/presentation/i18n";
export default async function WorkflowDefinitionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t, e, dateTime } = await getI18n();
  try {
    await requireAdminPermission("workflows.manage");
  } catch (err) {
    if (err instanceof ForbiddenAdminError) {
      return <ForbiddenNotice permissionKey="workflows.manage" />;
    }
    throw err;
  }

  const { id } = await params;
  const definition = await workflowDefinitionRepository.findById(id);

  if (!definition) {
    return (
      <div>
        <Link href="/admin/workflows" className="text-sm text-primary hover:underline">
          {t("ui.backToWorkflows")}
        </Link>
        <p className="mt-4 text-text-secondary">{t("ui.workflowDefinitionNotFound")}</p>
      </div>
    );
  }

  const instances = await workflowInstanceRepository.search({ workflowDefinitionId: id, limit: 20 });
  const boundActivate = setWorkflowDefinitionStatusAction.bind(null, definition.id, "PUBLISHED");
  const boundArchive = setWorkflowDefinitionStatusAction.bind(null, definition.id, "ARCHIVED");

  return (
    <div>
      <Link href="/admin/workflows" className="text-sm text-primary hover:underline">
        {t("ui.backToWorkflows")}
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">{definition.name}</h1>
          <p className="text-sm text-text-secondary">
            {definition.key} · v{definition.version} · triggers on {definition.triggerEventType} · {e("enum", definition.status)}
          </p>
        </div>
        <div className="flex gap-2">
          {definition.status !== "PUBLISHED" && (
            <form action={boundActivate}>
              <button type="submit" className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary">
                {t("ui.activate")}
              </button>
            </form>
          )}
          {definition.status !== "ARCHIVED" && (
            <form action={boundArchive}>
              <button type="submit" className="rounded-button bg-error px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                {t("ui.archive")}
              </button>
            </form>
          )}
        </div>
      </div>

      <h2 className="mt-6 text-sm font-semibold text-text-primary">{t("ui.steps")}</h2>
      <div className="mt-2 overflow-x-auto rounded-card border border-text-disabled/20 bg-surface-light">
        <table className="w-full text-start text-sm">
          <thead className="border-b border-text-disabled/20 text-xs uppercase text-text-secondary">
            <tr>
              <th className="px-4 py-3">{t("ui.order")}</th>
              <th className="px-4 py-3">{t("ui.stepKey")}</th>
              <th className="px-4 py-3">{t("ui.actionType")}</th>
              <th className="px-4 py-3">{t("ui.maxRetries")}</th>
              <th className="px-4 py-3">{t("ui.timeout")}</th>
            </tr>
          </thead>
          <tbody>
            {definition.steps.map((step) => (
              <tr key={step.id} className="border-b border-text-disabled/10 last:border-0">
                <td className="px-4 py-3 text-text-secondary">{step.order}</td>
                <td className="px-4 py-3 font-medium text-text-primary">{step.stepKey}</td>
                <td className="px-4 py-3 text-text-secondary">{step.actionType}</td>
                <td className="px-4 py-3 text-text-secondary">{step.maxRetries}</td>
                <td className="px-4 py-3 text-text-secondary">{step.timeoutSeconds ? `${step.timeoutSeconds}s` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-6 text-sm font-semibold text-text-primary">{t("ui.recentInstances")}</h2>
      <div className="mt-2 overflow-x-auto rounded-card border border-text-disabled/20 bg-surface-light">
        {instances.length === 0 ? (
          <EmptyState message={t("ui.noInstancesHaveRunForThisWorkflow")} />
        ) : (
          <table className="w-full text-start text-sm">
            <thead className="border-b border-text-disabled/20 text-xs uppercase text-text-secondary">
              <tr>
                <th className="px-4 py-3">{t("ui.started")}</th>
                <th className="px-4 py-3">{t("ui.relatedEntity")}</th>
                <th className="px-4 py-3">{t("ui.currentStep")}</th>
                <th className="px-4 py-3">{t("ui.status")}</th>
              </tr>
            </thead>
            <tbody>
              {instances.map((instance) => (
                <tr key={instance.id} className="border-b border-text-disabled/10 last:border-0 hover:bg-primary/5">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/workflows/${definition.id}/instances/${instance.id}`}
                      className="font-medium text-text-primary hover:text-primary"
                    >
                      {dateTime(instance.startedAt)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {e("enum", instance.relatedEntityType)} / {instance.relatedEntityId}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{instance.currentStepKey ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={instance.status === "FAILED" ? "text-error" : "text-text-secondary"}>{e("enum", instance.status)}</span>
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
