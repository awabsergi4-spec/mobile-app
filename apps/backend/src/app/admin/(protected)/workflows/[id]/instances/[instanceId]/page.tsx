import Link from "next/link";
import { ForbiddenAdminError, requireAdminPermission } from "@/presentation/admin-session";
import { ForbiddenNotice } from "@/presentation/admin-ui/forbidden-notice";
import { workflowInstanceRepository } from "@/infrastructure/workflow/workflow-admin-services";

import { getI18n } from "@/presentation/i18n";
export default async function WorkflowInstanceDetailPage({
  params,
}: {
  params: Promise<{ id: string; instanceId: string }>;
}) {
  const { t, e, dateTime } = await getI18n();
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
          {t("ui.backToWorkflow")}
        </Link>
        <p className="mt-4 text-text-secondary">{t("ui.workflowInstanceNotFound")}</p>
      </div>
    );
  }

  return (
    <div>
      <Link href={`/admin/workflows/${id}`} className="text-sm text-primary hover:underline">
        {t("ui.backToWorkflow")}
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-text-primary">{instance.workflowDefinitionName}</h1>
      <p className="text-sm text-text-secondary">
        {e("enum", instance.relatedEntityType)} / {instance.relatedEntityId} · started {dateTime(instance.startedAt)} ·{" "}
        <span className={instance.status === "FAILED" ? "text-error" : ""}>{e("enum", instance.status)}</span>
      </p>
      {instance.cancelReason && <p className="mt-2 text-sm text-error">{t("ui.cancelledReason", { reason: instance.cancelReason })}</p>}

      <h2 className="mt-6 text-sm font-semibold text-text-primary">{t("ui.stepExecutions")}</h2>
      <div className="mt-2 overflow-x-auto rounded-card border border-text-disabled/20 bg-surface-light">
        <table className="w-full text-start text-sm">
          <thead className="border-b border-text-disabled/20 text-xs uppercase text-text-secondary">
            <tr>
              <th className="px-4 py-3">{t("ui.step")}</th>
              <th className="px-4 py-3">{t("ui.action")}</th>
              <th className="px-4 py-3">{t("ui.attempt")}</th>
              <th className="px-4 py-3">{t("ui.started")}</th>
              <th className="px-4 py-3">{t("ui.status")}</th>
              <th className="px-4 py-3">{t("ui.error")}</th>
            </tr>
          </thead>
          <tbody>
            {instance.stepExecutions.map((se) => (
              <tr key={se.id} className="border-b border-text-disabled/10 last:border-0">
                <td className="px-4 py-3 font-medium text-text-primary">{se.stepKey}</td>
                <td className="px-4 py-3 text-text-secondary">{se.actionType}</td>
                <td className="px-4 py-3 text-text-secondary">{se.attempt}</td>
                <td className="px-4 py-3 text-text-secondary">{dateTime(se.startedAt)}</td>
                <td className="px-4 py-3">
                  <span className={se.status === "FAILED" ? "text-error" : "text-text-secondary"}>{e("enum", se.status)}</span>
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
