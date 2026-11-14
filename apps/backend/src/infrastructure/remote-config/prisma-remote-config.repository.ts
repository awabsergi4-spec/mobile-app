import type { PrismaClient } from "@prisma/client";
import type { RemoteConfigEntry } from "@/domain/remote-config/remote-config.entity";
import type {
  CreateRemoteConfigEntryInput,
  RemoteConfigRepository,
  SearchRemoteConfigEntriesFilter,
  UpdateRemoteConfigEntryInput,
} from "@/domain/remote-config/remote-config.repository";

export class PrismaRemoteConfigRepository implements RemoteConfigRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateRemoteConfigEntryInput): Promise<RemoteConfigEntry> {
    return this.prisma.remoteConfigEntry.create({
      data: {
        key: input.key,
        valueType: input.valueType,
        value: input.value as never,
        regionId: input.regionId,
        targetingRules: input.targetingRules as never,
        description: input.description,
        updatedById: input.updatedById,
      },
    }) as unknown as Promise<RemoteConfigEntry>;
  }

  async findById(id: string): Promise<RemoteConfigEntry | null> {
    return this.prisma.remoteConfigEntry.findUnique({ where: { id } }) as unknown as Promise<RemoteConfigEntry | null>;
  }

  async update(id: string, input: UpdateRemoteConfigEntryInput): Promise<RemoteConfigEntry> {
    return this.prisma.remoteConfigEntry.update({
      where: { id },
      data: {
        valueType: input.valueType,
        value: input.value as never,
        targetingRules: input.targetingRules as never,
        description: input.description,
        updatedById: input.updatedById,
      },
    }) as unknown as Promise<RemoteConfigEntry>;
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.remoteConfigEntry.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async search(filter: SearchRemoteConfigEntriesFilter): Promise<RemoteConfigEntry[]> {
    return this.prisma.remoteConfigEntry.findMany({
      where: {
        key: filter.key ? { contains: filter.key, mode: "insensitive" } : undefined,
        deletedAt: filter.includeDeleted ? undefined : null,
      },
      orderBy: { key: "asc" },
      take: filter.limit ?? 100,
    }) as unknown as Promise<RemoteConfigEntry[]>;
  }

  async resolveForRegion(regionId: string | null): Promise<RemoteConfigEntry[]> {
    const rows = (await this.prisma.remoteConfigEntry.findMany({
      where: {
        deletedAt: null,
        OR: [{ regionId: null }, ...(regionId ? [{ regionId }] : [])],
      },
    })) as unknown as RemoteConfigEntry[];

    const byKey = new Map<string, RemoteConfigEntry>();
    for (const row of rows) {
      const existing = byKey.get(row.key);
      // A region-scoped row overrides the global (regionId: null) row.
      if (!existing || (existing.regionId === null && row.regionId !== null)) {
        byKey.set(row.key, row);
      }
    }
    return Array.from(byKey.values());
  }
}
