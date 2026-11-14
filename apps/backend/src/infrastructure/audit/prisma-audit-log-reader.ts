import type { PrismaClient } from "@prisma/client";
import type { AuditLogEntry } from "@/domain/audit/audit-log.entity";
import type { AuditLogReader, SearchAuditLogFilter } from "@/domain/audit/audit-log-reader";

export class PrismaAuditLogReader implements AuditLogReader {
  constructor(private readonly prisma: PrismaClient) {}

  async search(filter: SearchAuditLogFilter): Promise<AuditLogEntry[]> {
    return this.prisma.auditLog.findMany({
      where: {
        actorId: filter.actorId,
        entityType: filter.entityType,
        entityId: filter.entityId,
        action: filter.action ? { contains: filter.action, mode: "insensitive" } : undefined,
      },
      orderBy: { createdAt: "desc" },
      take: filter.limit ?? 50,
      ...(filter.cursor ? { cursor: { id: filter.cursor }, skip: 1 } : {}),
    }) as unknown as Promise<AuditLogEntry[]>;
  }
}
