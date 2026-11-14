"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/presentation/admin-session";
import { createRemoteConfigEntryUseCase, updateRemoteConfigEntryUseCase, deleteRemoteConfigEntryUseCase } from "@/infrastructure/remote-config/remote-config-services";
import type { RemoteConfigValueType } from "@prisma/client";

function parseValue(valueType: RemoteConfigValueType, raw: string): unknown {
  switch (valueType) {
    case "BOOLEAN":
      return raw === "true";
    case "NUMBER": {
      const n = Number(raw);
      if (!Number.isFinite(n)) {
        throw new Error("Value must be a valid number.");
      }
      return n;
    }
    case "STRING":
      return raw;
    case "JSON":
      try {
        return JSON.parse(raw);
      } catch {
        throw new Error("Value must be valid JSON.");
      }
  }
}

export async function createConfigEntryAction(formData: FormData): Promise<void> {
  const { userId: actorId } = await requireAdminPermission("config.manage");

  const key = String(formData.get("key") ?? "").trim();
  if (key.length < 1) {
    throw new Error("Key is required.");
  }
  const valueType = String(formData.get("valueType")) as RemoteConfigValueType;
  const value = parseValue(valueType, String(formData.get("value") ?? ""));
  const regionId = String(formData.get("regionId") ?? "").trim() || undefined;
  const description = String(formData.get("description") ?? "").trim() || undefined;

  const entry = await createRemoteConfigEntryUseCase.execute({
    key,
    valueType,
    value,
    regionId,
    description,
    updatedById: actorId,
    actorId,
  });

  revalidatePath("/admin/config");
  redirect(`/admin/config/${entry.id}`);
}

export async function updateConfigEntryAction(entryId: string, formData: FormData): Promise<void> {
  const { userId: actorId } = await requireAdminPermission("config.manage");

  const valueType = String(formData.get("valueType")) as RemoteConfigValueType;
  const value = parseValue(valueType, String(formData.get("value") ?? ""));
  const description = String(formData.get("description") ?? "").trim() || undefined;

  await updateRemoteConfigEntryUseCase.execute({ entryId, actorId, updatedById: actorId, valueType, value, description });
  revalidatePath(`/admin/config/${entryId}`);
  revalidatePath("/admin/config");
}

export async function deleteConfigEntryAction(entryId: string): Promise<void> {
  const { userId: actorId } = await requireAdminPermission("config.manage");
  await deleteRemoteConfigEntryUseCase.execute(entryId, actorId);
  revalidatePath("/admin/config");
  redirect("/admin/config");
}
