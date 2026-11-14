import type { PrismaClient } from "@prisma/client";
import type { Notification } from "@/domain/notification/notification.entity";
import type {
  CreateNotificationInput,
  ListNotificationsFilter,
  NotificationRepository,
} from "@/domain/notification/notification.repository";

export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createMany(inputs: CreateNotificationInput[]): Promise<number> {
    if (inputs.length === 0) {
      return 0;
    }
    const result = await this.prisma.notification.createMany({
      data: inputs.map((input) => ({
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data as never,
      })),
    });
    return result.count;
  }

  async listForUser(userId: string, filter: ListNotificationsFilter): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { userId, readAt: filter.unreadOnly ? null : undefined },
      orderBy: { createdAt: "desc" },
      take: filter.limit ?? 50,
      ...(filter.cursor ? { cursor: { id: filter.cursor }, skip: 1 } : {}),
    }) as unknown as Promise<Notification[]>;
  }

  async countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  async markRead(id: string, userId: string): Promise<void> {
    await this.prisma.notification.updateMany({ where: { id, userId, readAt: null }, data: { readAt: new Date() } });
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
    return result.count;
  }
}
