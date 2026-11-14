import { randomUUID } from "crypto";
import type { ProviderProfile, AccountLifecycleStatus, AvailabilityMode, VerificationStatus } from "@/domain/provider/provider-profile.entity";
import type {
  ProviderProfileRepository,
  CreateProviderProfileInput,
  UpdateProviderProfileInput,
} from "@/domain/provider/provider-profile.repository";
import type {
  ProviderDocument,
  ProviderDocumentStatus,
  ProviderDocumentRepository,
  CreateProviderDocumentInput,
} from "@/domain/provider/provider-document.repository";
import type { AuditLogEntry, AuditLogWriter } from "@/domain/audit/audit-log-writer";
import type { DomainEventPublisher, PublishDomainEventInput } from "@/domain/workflow/domain-event-publisher";

// Hand-written fakes, matching the discipline established in
// application/identity/__tests__/fakes.ts — small interfaces get a real
// minimal implementation instead of a mocking library.

export class FakeProviderProfileRepository implements ProviderProfileRepository {
  private readonly byId = new Map<string, ProviderProfile>();

  seed(profile: ProviderProfile): void {
    this.byId.set(profile.id, profile);
  }

  async create(input: CreateProviderProfileInput): Promise<ProviderProfile> {
    const profile: ProviderProfile = {
      id: randomUUID(),
      userId: input.userId,
      companyId: input.companyId ?? null,
      businessName: input.businessName,
      bio: input.bio ?? null,
      businessLogoUrl: null,
      taxNumber: null,
      yearsOfExperience: input.yearsOfExperience ?? null,
      skills: input.skills ?? [],
      travelDistanceKm: input.travelDistanceKm ?? null,
      remoteAvailable: input.remoteAvailable ?? false,
      emergencyAvailable: false,
      verificationStatus: "UNVERIFIED",
      verifiedAt: null,
      ratingAverage: 0,
      ratingCount: 0,
      completedJobsCount: 0,
      cancellationRate: 0,
      avgResponseSeconds: null,
      isAvailable: false,
      availabilityMode: "OFFLINE",
      status: "ACTIVE",
      suspendedAt: null,
      suspendedReason: null,
      deletedAt: null,
      emergencyContactName: null,
      emergencyContactPhone: null,
      createdAt: new Date(),
    };
    this.byId.set(profile.id, profile);
    return profile;
  }

  async findById(id: string): Promise<ProviderProfile | null> {
    return this.byId.get(id) ?? null;
  }

  async findByUserId(userId: string): Promise<ProviderProfile | null> {
    return [...this.byId.values()].find((p) => p.userId === userId) ?? null;
  }

  async update(id: string, input: UpdateProviderProfileInput): Promise<ProviderProfile> {
    const existing = this.byId.get(id);
    if (!existing) throw new Error("not found");
    const updated = { ...existing, ...input };
    this.byId.set(id, updated);
    return updated;
  }

  async updateLifecycleStatus(id: string, status: AccountLifecycleStatus, details?: { reason?: string }): Promise<void> {
    const existing = this.byId.get(id);
    if (!existing) return;
    existing.status = status;
    existing.suspendedAt = status === "SUSPENDED" ? new Date() : null;
    existing.suspendedReason = status === "SUSPENDED" ? (details?.reason ?? null) : null;
    existing.deletedAt = status === "DELETED" ? new Date() : null;
  }

  async updateVerificationStatus(id: string, status: VerificationStatus): Promise<void> {
    const existing = this.byId.get(id);
    if (!existing) return;
    existing.verificationStatus = status;
    existing.verifiedAt = status === "VERIFIED" ? new Date() : existing.verifiedAt;
  }

  async updateAvailability(id: string, mode: AvailabilityMode, isAvailable: boolean): Promise<void> {
    const existing = this.byId.get(id);
    if (!existing) return;
    existing.availabilityMode = mode;
    existing.isAvailable = isAvailable;
  }

  async search(): Promise<ProviderProfile[]> {
    return [...this.byId.values()];
  }
}

export class FakeProviderDocumentRepository implements ProviderDocumentRepository {
  private readonly rows = new Map<string, ProviderDocument>();

  async create(input: CreateProviderDocumentInput): Promise<ProviderDocument> {
    const document: ProviderDocument = {
      id: randomUUID(),
      providerId: input.providerId,
      type: input.type,
      fileUrl: input.fileUrl,
      status: "PENDING",
      reviewedAt: null,
      createdAt: new Date(),
    };
    this.rows.set(document.id, document);
    return document;
  }

  async findById(id: string): Promise<ProviderDocument | null> {
    return this.rows.get(id) ?? null;
  }

  async listByProviderId(providerId: string): Promise<ProviderDocument[]> {
    return [...this.rows.values()].filter((d) => d.providerId === providerId);
  }

  async countByProviderId(providerId: string): Promise<number> {
    return [...this.rows.values()].filter((d) => d.providerId === providerId).length;
  }

  async updateStatus(id: string, status: ProviderDocumentStatus): Promise<ProviderDocument> {
    const existing = this.rows.get(id);
    if (!existing) throw new Error("not found");
    existing.status = status;
    existing.reviewedAt = new Date();
    return existing;
  }
}

export class FakeAuditLogWriter implements AuditLogWriter {
  readonly entries: AuditLogEntry[] = [];

  async write(entry: AuditLogEntry): Promise<void> {
    this.entries.push(entry);
  }
}

export class FakeDomainEventPublisher implements DomainEventPublisher {
  readonly published: PublishDomainEventInput[] = [];

  async publish(input: PublishDomainEventInput): Promise<{ eventId: string }> {
    this.published.push(input);
    return { eventId: randomUUID() };
  }
}
