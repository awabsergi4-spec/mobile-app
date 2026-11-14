import type { PrismaClient } from "@prisma/client";
import type { RemoteConfigReader } from "@/domain/config/remote-config-reader";

export class PrismaRemoteConfigReader implements RemoteConfigReader {
  constructor(private readonly prisma: PrismaClient) {}

  async getNumber(key: string, fallback: number, regionId?: string): Promise<number> {
    const row = await this.prisma.remoteConfigEntry.findFirst({
      where: { key, regionId: regionId ?? null, deletedAt: null },
    });

    if (!row || typeof row.value !== "number") {
      return fallback;
    }

    return row.value;
  }
}
