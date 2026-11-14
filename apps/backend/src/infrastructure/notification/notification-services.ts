import { prisma } from "@/infrastructure/prisma-client";
import { PrismaNotificationRepository } from "./prisma-notification.repository";
import { PrismaNotificationBroadcastRepository } from "./prisma-notification-broadcast.repository";
import { NotificationTargetResolver } from "./notification-target-resolver";
import { auditLogWriter } from "@/infrastructure/provider/provider-services";
import { CreateNotificationBroadcastUseCase } from "@/application/notification/create-broadcast.use-case";
import { SendNotificationBroadcastUseCase } from "@/application/notification/send-broadcast.use-case";
import { MarkNotificationReadUseCase, MarkAllNotificationsReadUseCase } from "@/application/notification/mark-notification-read.use-case";

export const notificationRepository = new PrismaNotificationRepository(prisma);
export const notificationBroadcastRepository = new PrismaNotificationBroadcastRepository(prisma);
export const notificationTargetResolver = new NotificationTargetResolver(prisma);

export const createNotificationBroadcastUseCase = new CreateNotificationBroadcastUseCase(notificationBroadcastRepository, auditLogWriter);
export const sendNotificationBroadcastUseCase = new SendNotificationBroadcastUseCase(
  notificationBroadcastRepository,
  notificationRepository,
  notificationTargetResolver,
  auditLogWriter,
);
export const markNotificationReadUseCase = new MarkNotificationReadUseCase(notificationRepository);
export const markAllNotificationsReadUseCase = new MarkAllNotificationsReadUseCase(notificationRepository);
