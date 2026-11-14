"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/presentation/admin-session";
import { setAiFeatureToggleUseCase } from "@/infrastructure/ai/ai-feature-toggle-services";
import type { AiCapability } from "@prisma/client";

export async function setAiFeatureToggleAction(capability: AiCapability, formData: FormData): Promise<void> {
  const { userId: actorId } = await requireAdminPermission("ai.manage");

  const isEnabled = formData.get("isEnabled") === "on";
  const provider = String(formData.get("provider") ?? "rule-based").trim() || "rule-based";

  await setAiFeatureToggleUseCase.execute({ capability, isEnabled, provider, actorId });
  revalidatePath("/admin/ai");
}
