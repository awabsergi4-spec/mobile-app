import type { PrismaClient } from "@prisma/client";
import type {
  OnDemandTrackingPing,
  OnDemandTrackingRepository,
  RecordTrackingPingInput,
} from "@/domain/on-demand/on-demand-tracking.repository";

export class PrismaOnDemandTrackingRepository implements OnDemandTrackingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async record(input: RecordTrackingPingInput): Promise<OnDemandTrackingPing> {
    return this.prisma.onDemandTrackingPing.create({
      data: { requestId: input.requestId, lat: input.lat, lng: input.lng },
    });
  }

  async listByRequestId(requestId: string): Promise<OnDemandTrackingPing[]> {
    return this.prisma.onDemandTrackingPing.findMany({
      where: { requestId },
      orderBy: { recordedAt: "asc" },
    });
  }
}
