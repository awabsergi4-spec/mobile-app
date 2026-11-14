import type { PrismaClient } from "@prisma/client";
import type { OnDemandRequest, OnDemandStatus } from "@/domain/on-demand/on-demand-request.entity";
import type {
  CreateOnDemandRequestInput,
  ListByCustomerFilter,
  OnDemandRequestRepository,
  SearchOnDemandRequestsFilter,
} from "@/domain/on-demand/on-demand-request.repository";

export class PrismaOnDemandRequestRepository implements OnDemandRequestRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateOnDemandRequestInput): Promise<OnDemandRequest> {
    return this.prisma.onDemandRequest.create({
      data: {
        customerId: input.customerId,
        companyId: input.companyId,
        categoryId: input.categoryId,
        description: input.description,
        lat: input.lat,
        lng: input.lng,
        fulfillmentMode: input.fulfillmentMode ?? "INSTANT",
        scheduledFor: input.scheduledFor,
        isEmergency: input.isEmergency ?? false,
      },
    }) as unknown as Promise<OnDemandRequest>;
  }

  async findById(id: string): Promise<OnDemandRequest | null> {
    return this.prisma.onDemandRequest.findUnique({ where: { id } }) as unknown as Promise<OnDemandRequest | null>;
  }

  async updateStatus(
    id: string,
    status: OnDemandStatus,
    details?: { completedAt?: Date; cancelledAt?: Date },
  ): Promise<OnDemandRequest> {
    return this.prisma.onDemandRequest.update({
      where: { id },
      data: { status, completedAt: details?.completedAt, cancelledAt: details?.cancelledAt },
    }) as unknown as Promise<OnDemandRequest>;
  }

  async search(filter: SearchOnDemandRequestsFilter): Promise<OnDemandRequest[]> {
    return this.prisma.onDemandRequest.findMany({
      where: { status: filter.status },
      orderBy: { createdAt: "desc" },
      take: filter.limit ?? 25,
      ...(filter.cursor ? { cursor: { id: filter.cursor }, skip: 1 } : {}),
    }) as unknown as Promise<OnDemandRequest[]>;
  }

  async listByCustomerId(customerId: string, filter: ListByCustomerFilter): Promise<OnDemandRequest[]> {
    return this.prisma.onDemandRequest.findMany({
      where: { customerId, status: filter.status },
      orderBy: { createdAt: "desc" },
      take: filter.limit ?? 25,
      ...(filter.cursor ? { cursor: { id: filter.cursor }, skip: 1 } : {}),
    }) as unknown as Promise<OnDemandRequest[]>;
  }
}
