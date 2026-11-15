"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/presentation/admin-session";
import { createWorkflowDefinitionUseCase, setWorkflowDefinitionStatusUseCase } from "@/infrastructure/workflow/workflow-admin-services";
import { createWorkflowDefinitionSchema } from "@sahl/shared/schemas/workflow.schema";

import { getI18n } from "@/presentation/i18n";
export async function createWorkflowDefinitionAction(formData: FormData): Promise<void> {
  const { t } = await getI18n();
  const { userId: actorId } = await requireAdminPermission("workflows.manage");

  const key = String(formData.get("key") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const triggerEventType = String(formData.get("triggerEventType") ?? "").trim();
  const priority = Number(formData.get("priority") ?? 0) || 0;
  const stepsRaw = String(formData.get("steps") ?? "");

  let stepsJson: unknown;
  try {
    stepsJson = JSON.parse(stepsRaw);
  } catch {
    throw new Error(t("ui.stepsMustBeValidJsonAnArray"));
  }

  const parsed = createWorkflowDefinitionSchema.safeParse({ key, name, triggerEventType, priority, steps: stepsJson });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid workflow definition.");
  }

  const definition = await createWorkflowDefinitionUseCase.execute({ ...parsed.data, actorId });
  revalidatePath("/admin/workflows");
  redirect(`/admin/workflows/${definition.id}`);
}

export async function setWorkflowDefinitionStatusAction(workflowDefinitionId: string, status: "PUBLISHED" | "ARCHIVED"): Promise<void> {
  const { userId: actorId } = await requireAdminPermission("workflows.manage");
  await setWorkflowDefinitionStatusUseCase.execute({ workflowDefinitionId, status, actorId });
  revalidatePath(`/admin/workflows/${workflowDefinitionId}`);
  revalidatePath("/admin/workflows");
}
