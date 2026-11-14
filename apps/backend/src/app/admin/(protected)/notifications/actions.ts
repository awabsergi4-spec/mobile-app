"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/presentation/admin-session";
import { createNotificationBroadcastUseCase, sendNotificationBroadcastUseCase } from "@/infrastructure/notification/notification-services";
import type { NotificationChannel } from "@prisma/client";

export async function createBroadcastAction(formData: FormData): Promise<void> {
  const { userId: actorId } = await requireAdminPermission("notifications.manage");

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (title.length < 1 || body.length < 1) {
    throw new Error("Title and body are required.");
  }

  const broadcast = await createNotificationBroadcastUseCase.execute({
    channel: String(formData.get("channel")) as NotificationChannel,
    title,
    body,
    createdById: actorId,
    actorId,
  });

  revalidatePath("/admin/notifications");
  redirect(`/admin/notifications/${broadcast.id}`);
}

export async function sendBroadcastAction(broadcastId: string): Promise<void> {
  const { userId: actorId } = await requireAdminPermission("notifications.manage");
  await sendNotificationBroadcastUseCase.execute({ broadcastId, actorId });
  revalidatePath(`/admin/notifications/${broadcastId}`);
  revalidatePath("/admin/notifications");
}
