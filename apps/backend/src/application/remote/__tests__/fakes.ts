import { randomUUID } from "crypto";
import type {
  AccountLifecycleStatus,
  AvailabilityMode,
  ProviderProfile,
  VerificationStatus,
} from "@/domain/provider/provider-profile.entity";
import type {
  CreateProviderProfileInput,
  ProviderProfileRepository,
  UpdateProviderProfileInput,
} from "@/domain/provider/provider-profile.repository";
import type { RemoteEngagement, RemoteEngagementStatus } from "@/domain/remote/remote-engagement.entity";
import type {
  CreateRemoteEngagementInput,
  ListByPartyFilter,
  RemoteEngagementRepository,
} from "@/domain/remote/remote-engagement.repository";
import type {
  CreateRemoteMilestoneInput,
  MilestoneStatus,
  RemoteMilestone,
  RemoteMilestoneRepository,
} from "@/domain/remote/remote-milestone.repository";
import type {
  CreateRemoteRevisionInput,
  RemoteRevision,
  RemoteRevisionRepository,
  RevisionStatus,
} from "@/domain/remote/remote-revision.repository";
import type { DomainEventPublisher, PublishDomainEventInput } from "@/domain/workflow/domain-event-publisher";

export class FakeRemoteEngagementRepository implements RemoteEngagementRepository {
  private readonly byId = new Map<string, RemoteEngagement>();

  async create(input: CreateRemoteEngagementInput): Promise<RemoteEngagement> {
    const engagement: RemoteEngagement = {
      id: randomUUID(),
      customerId: input.customerId,
      companyId: input.companyId ?? null,
      providerId: input.providerId,
      categoryId: input.categoryId,
      title: input.title,
      priceType: input.priceType,
      amount: input.amount,
      status: "ACTIVE",
      createdAt: new Date(),
      completedAt: null,
    };
    this.byId.set(engagement.id, engagement);
    return engagement;
  }

  async findById(id: string): Promise<RemoteEngagement | null> {
    return this.byId.get(id) ?? null;
  }

  async updateStatus(id: string, status: RemoteEngagementStatus, details?: { completedAt?: Date }): Promise<RemoteEngagement> {
    const existing = this.byId.get(id);
    if (!existing) throw new Error("not found");
    existing.status = status;
    if (details?.completedAt) existing.completedAt = details.completedAt;
    return existing;
  }

  async search(): Promise<RemoteEngagement[]> {
    return [...this.byId.values()];
  }

  async listByCustomerId(customerId: string, filter: ListByPartyFilter): Promise<RemoteEngagement[]> {
    return [...this.byId.values()].filter((e) => e.customerId === customerId && (!filter.status || e.status === filter.status));
  }

  async listByProviderId(providerId: string, filter: ListByPartyFilter): Promise<RemoteEngagement[]> {
    return [...this.byId.values()].filter((e) => e.providerId === providerId && (!filter.status || e.status === filter.status));
  }
}

export class FakeRemoteMilestoneRepository implements RemoteMilestoneRepository {
  private readonly byId = new Map<string, RemoteMilestone>();

  async create(input: CreateRemoteMilestoneInput): Promise<RemoteMilestone> {
    const milestone: RemoteMilestone = {
      id: randomUUID(),
      engagementId: input.engagementId,
      title: input.title,
      amount: input.amount,
      status: "PENDING",
      dueDate: input.dueDate ?? null,
    };
    this.byId.set(milestone.id, milestone);
    return milestone;
  }

  async findById(id: string): Promise<RemoteMilestone | null> {
    return this.byId.get(id) ?? null;
  }

  async listByEngagementId(engagementId: string): Promise<RemoteMilestone[]> {
    return [...this.byId.values()].filter((m) => m.engagementId === engagementId);
  }

  async updateStatus(id: string, status: MilestoneStatus): Promise<RemoteMilestone> {
    const existing = this.byId.get(id);
    if (!existing) throw new Error("not found");
    existing.status = status;
    return existing;
  }
}

export class FakeRemoteRevisionRepository implements RemoteRevisionRepository {
  private readonly byId = new Map<string, RemoteRevision>();

  async create(input: CreateRemoteRevisionInput): Promise<RemoteRevision> {
    const revision: RemoteRevision = {
      id: randomUUID(),
      engagementId: input.engagementId,
      requestedBy: input.requestedBy,
      notes: input.notes,
      status: "REQUESTED",
      createdAt: new Date(),
    };
    this.byId.set(revision.id, revision);
    return revision;
  }

  async findById(id: string): Promise<RemoteRevision | null> {
    return this.byId.get(id) ?? null;
  }

  async listByEngagementId(engagementId: string): Promise<RemoteRevision[]> {
    return [...this.byId.values()].filter((r) => r.engagementId === engagementId);
  }

  async updateStatus(id: string, status: RevisionStatus): Promise<RemoteRevision> {
    const existing = this.byId.get(id);
    if (!existing) throw new Error("not found");
    existing.status = status;
    return existing;
  }
}

export class FakeDomainEventPublisher implements DomainEventPublisher {
  readonly published: PublishDomainEventInput[] = [];

  async publish(input: PublishDomainEventInput): Promise<{ eventId: string }> {
    this.published.push(input);
    return { eventId: randomUUID() };
  }
}

// Minimal fake — only findById is exercised by CreateRemoteEngagementUseCase's
// eligibility check. Mirrors application/contract/__tests__/fakes.ts'
// FakeProviderProfileRepository.
export class FakeProviderProfileRepository implements ProviderProfileRepository {
  private readonly byId = new Map<string, ProviderProfile>();

  seed(profile: ProviderProfile): void {
    this.byId.set(profile.id, profile);
  }

  seedEligible(providerId: string): void {
    this.seed({
      id: providerId,
      userId: `user-for-${providerId}`,
      companyId: null,
      businessName: "Test Provider",
      bio: null,
      businessLogoUrl: null,
      taxNumber: null,
      yearsOfExperience: null,
      skills: [],
      travelDistanceKm: null,
      remoteAvailable: true,
      emergencyAvailable: false,
      verificationStatus: "VERIFIED",
      verifiedAt: new Date(),
      ratingAverage: 4.5,
      ratingCount: 10,
      completedJobsCount: 10,
      cancellationRate: 0,
      avgResponseSeconds: null,
      isAvailable: true,
      availabilityMode: "ONLINE",
      status: "ACTIVE",
      suspendedAt: null,
      suspendedReason: null,
      deletedAt: null,
      emergencyContactName: null,
      emergencyContactPhone: null,
      createdAt: new Date(),
    });
  }

  async create(_input: CreateProviderProfileInput): Promise<ProviderProfile> {
    throw new Error("not implemented in this fake");
  }

  async findById(id: string): Promise<ProviderProfile | null> {
    return this.byId.get(id) ?? null;
  }

  async findByUserId(_userId: string): Promise<ProviderProfile | null> {
    throw new Error("not implemented in this fake");
  }

  async update(_id: string, _input: UpdateProviderProfileInput): Promise<ProviderProfile> {
    throw new Error("not implemented in this fake");
  }

  async updateLifecycleStatus(_id: string, _status: AccountLifecycleStatus): Promise<void> {
    throw new Error("not implemented in this fake");
  }

  async updateVerificationStatus(_id: string, _status: VerificationStatus): Promise<void> {
    throw new Error("not implemented in this fake");
  }

  async updateAvailability(_id: string, _mode: AvailabilityMode, _isAvailable: boolean): Promise<void> {
    throw new Error("not implemented in this fake");
  }

  async search(): Promise<ProviderProfile[]> {
    throw new Error("not implemented in this fake");
  }
}
