import type { PrismaClient } from "@prisma/client";
import type { NotificationBroadcast } from "@/domain/notification/notification.entity";
import type {
  CreateNotificationBroadcastInput,
  NotificationBroadcastRepository,
  SearchNotificationBroadcastsFilter,
} from "@/domain/notification/notification-broadcast.repository";

export class PrismaNotificationBroadcastRepository implements NotificationBroadcastRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateNotificationBroadcastInput): Promise<NotificationBroadcast> {
    return this.prisma.notificationBroadcast.create({
      data: {
        channel: input.channel,
        templateKey: input.templateKey,
        title: input.title,
        body: input.body,
        targetingRules: input.targetingRules as never,
        scheduledFor: input.scheduledFor,
        createdById: input.createdById,
      },
    }) as unknown as Promise<NotificationBroadcast>;
  }

  async findById(id: string): Promise<NotificationBroadcast | null> {
    return this.prisma.notificationBroadcast.findUnique({ where: { id } }) as unknown as Promise<NotificationBroadcast | null>;
  }

  async search(filter: SearchNotificationBroadcastsFilter): Promise<NotificationBroadcast[]> {
    return this.prisma.notificationBroadcast.findMany({
      where: { status: filter.status },
      orderBy: { createdAt: "desc" },
      take: filter.limit ?? 50,
    }) as unknown as Promise<NotificationBroadcast[]>;
  }

  async markSent(id: string, sentAt: Date): Promise<void> {
    await this.prisma.notificationBroadcast.update({ where: { id }, data: { status: "PUBLISHED", sentAt } });
  }
}
