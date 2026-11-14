import { randomUUID } from "crypto";
import type { OnDemandRequest, OnDemandStatus } from "@/domain/on-demand/on-demand-request.entity";
import type {
  CreateOnDemandRequestInput,
  ListByCustomerFilter,
  OnDemandRequestRepository,
} from "@/domain/on-demand/on-demand-request.repository";
import type {
  AssignmentStatus,
  CreateOnDemandAssignmentInput,
  ListByProviderFilter,
  OnDemandAssignment,
  OnDemandAssignmentRepository,
} from "@/domain/on-demand/on-demand-assignment.repository";
import type {
  OnDemandTrackingPing,
  OnDemandTrackingRepository,
  RecordTrackingPingInput,
} from "@/domain/on-demand/on-demand-tracking.repository";
import type { FindCandidatesInput, ProviderMatchCandidate, ProviderMatcher } from "@/domain/on-demand/provider-matcher";
import type { DomainEventPublisher, PublishDomainEventInput } from "@/domain/workflow/domain-event-publisher";

export class FakeOnDemandRequestRepository implements OnDemandRequestRepository {
  private readonly byId = new Map<string, OnDemandRequest>();

  async create(input: CreateOnDemandRequestInput): Promise<OnDemandRequest> {
    const request: OnDemandRequest = {
      id: randomUUID(),
      customerId: input.customerId,
      companyId: input.companyId ?? null,
      categoryId: input.categoryId,
      description: input.description,
      lat: input.lat,
      lng: input.lng,
      status: "SEARCHING",
      fulfillmentMode: input.fulfillmentMode ?? "INSTANT",
      scheduledFor: input.scheduledFor ?? null,
      isEmergency: input.isEmergency ?? false,
      createdAt: new Date(),
      completedAt: null,
      cancelledAt: null,
    };
    this.byId.set(request.id, request);
    return request;
  }

  async findById(id: string): Promise<OnDemandRequest | null> {
    return this.byId.get(id) ?? null;
  }

  async updateStatus(
    id: string,
    status: OnDemandStatus,
    details?: { completedAt?: Date; cancelledAt?: Date },
  ): Promise<OnDemandRequest> {
    const existing = this.byId.get(id);
    if (!existing) throw new Error("not found");
    existing.status = status;
    if (details?.completedAt) existing.completedAt = details.completedAt;
    if (details?.cancelledAt) existing.cancelledAt = details.cancelledAt;
    return existing;
  }

  async search(): Promise<OnDemandRequest[]> {
    return [...this.byId.values()];
  }

  async listByCustomerId(customerId: string, filter: ListByCustomerFilter): Promise<OnDemandRequest[]> {
    return [...this.byId.values()].filter((r) => r.customerId === customerId && (!filter.status || r.status === filter.status));
  }
}

export class FakeOnDemandAssignmentRepository implements OnDemandAssignmentRepository {
  private readonly byId = new Map<string, OnDemandAssignment>();

  async create(input: CreateOnDemandAssignmentInput): Promise<OnDemandAssignment> {
    const assignment: OnDemandAssignment = {
      id: randomUUID(),
      requestId: input.requestId,
      providerId: input.providerId,
      status: "OFFERED",
      offeredAt: new Date(),
      respondedAt: null,
      quotedPrice: input.quotedPrice ?? null,
    };
    this.byId.set(assignment.id, assignment);
    return assignment;
  }

  async findById(id: string): Promise<OnDemandAssignment | null> {
    return this.byId.get(id) ?? null;
  }

  async listByRequestId(requestId: string): Promise<OnDemandAssignment[]> {
    return [...this.byId.values()].filter((a) => a.requestId === requestId);
  }

  async listByProviderId(providerId: string, filter: ListByProviderFilter): Promise<OnDemandAssignment[]> {
    return [...this.byId.values()].filter((a) => a.providerId === providerId && (!filter.status || a.status === filter.status));
  }

  async updateStatus(id: string, status: AssignmentStatus, details?: { respondedAt?: Date }): Promise<OnDemandAssignment> {
    const existing = this.byId.get(id);
    if (!existing) throw new Error("not found");
    existing.status = status;
    if (details?.respondedAt) existing.respondedAt = details.respondedAt;
    return existing;
  }

  async compareAndSetStatus(
    id: string,
    fromStatus: AssignmentStatus,
    toStatus: AssignmentStatus,
    details?: { respondedAt?: Date },
  ): Promise<boolean> {
    const existing = this.byId.get(id);
    if (!existing || existing.status !== fromStatus) return false;
    existing.status = toStatus;
    if (details?.respondedAt) existing.respondedAt = details.respondedAt;
    return true;
  }

  async expirePendingOffers(requestId: string, exceptAssignmentId: string): Promise<void> {
    for (const assignment of this.byId.values()) {
      if (assignment.requestId === requestId && assignment.status === "OFFERED" && assignment.id !== exceptAssignmentId) {
        assignment.status = "EXPIRED";
        assignment.respondedAt = new Date();
      }
    }
  }
}

export class FakeOnDemandTrackingRepository implements OnDemandTrackingRepository {
  private readonly rows: OnDemandTrackingPing[] = [];

  async record(input: RecordTrackingPingInput): Promise<OnDemandTrackingPing> {
    const ping: OnDemandTrackingPing = { id: randomUUID(), requestId: input.requestId, lat: input.lat, lng: input.lng, recordedAt: new Date() };
    this.rows.push(ping);
    return ping;
  }

  async listByRequestId(requestId: string): Promise<OnDemandTrackingPing[]> {
    return this.rows.filter((p) => p.requestId === requestId);
  }
}

// Scripted matcher — returns whatever candidate queue was seeded, filtered
// by excludeProviderIds, rather than a real distance/rating computation.
export class FakeProviderMatcher implements ProviderMatcher {
  constructor(private readonly candidates: ProviderMatchCandidate[] = []) {}

  async findCandidates(input: FindCandidatesInput): Promise<ProviderMatchCandidate[]> {
    const excluded = new Set(input.excludeProviderIds ?? []);
    const remaining = this.candidates.filter((c) => !excluded.has(c.providerId));
    return remaining.slice(0, input.limit ?? remaining.length);
  }
}

export class FakeDomainEventPublisher implements DomainEventPublisher {
  readonly published: PublishDomainEventInput[] = [];

  async publish(input: PublishDomainEventInput): Promise<{ eventId: string }> {
    this.published.push(input);
    return { eventId: randomUUID() };
  }
}
