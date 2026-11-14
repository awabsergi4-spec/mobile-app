import { randomUUID } from "crypto";
import type { AccountLifecycleStatus, Company, VerificationStatus } from "@/domain/company/company.entity";
import type { CompanyRepository, CreateCompanyInput, UpdateCompanyInput } from "@/domain/company/company.repository";
import type {
  AddCompanyMemberInput,
  CompanyMember,
  CompanyMemberRepository,
} from "@/domain/company/company-member.repository";
import type {
  CompanyInvitation,
  CompanyInvitationRepository,
  CompanyInvitationStatus,
  CreateCompanyInvitationInput,
} from "@/domain/company/company-invitation.repository";
import type {
  CompanyDocument,
  CompanyDocumentRepository,
  CompanyDocumentStatus,
  CreateCompanyDocumentInput,
} from "@/domain/company/company-document.repository";
import type { AuditLogEntry, AuditLogWriter } from "@/domain/audit/audit-log-writer";
import type { DomainEventPublisher, PublishDomainEventInput } from "@/domain/workflow/domain-event-publisher";

export class FakeCompanyRepository implements CompanyRepository {
  private readonly byId = new Map<string, Company>();

  async create(input: CreateCompanyInput): Promise<Company> {
    const company: Company = {
      id: randomUUID(),
      ownerId: input.ownerId,
      name: input.name,
      description: input.description ?? null,
      logoUrl: input.logoUrl ?? null,
      regionId: input.regionId,
      verificationStatus: "UNVERIFIED",
      verifiedAt: null,
      status: "ACTIVE",
      suspendedAt: null,
      suspendedReason: null,
      deletedAt: null,
      createdAt: new Date(),
    };
    this.byId.set(company.id, company);
    return company;
  }

  async findById(id: string): Promise<Company | null> {
    return this.byId.get(id) ?? null;
  }

  async findByOwnerId(ownerId: string): Promise<Company | null> {
    return [...this.byId.values()].find((c) => c.ownerId === ownerId) ?? null;
  }

  async update(id: string, input: UpdateCompanyInput): Promise<Company> {
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

  async search(): Promise<Company[]> {
    return [...this.byId.values()];
  }
}

export class FakeCompanyMemberRepository implements CompanyMemberRepository {
  private readonly byId = new Map<string, CompanyMember>();

  async add(input: AddCompanyMemberInput): Promise<CompanyMember> {
    const member: CompanyMember = {
      id: randomUUID(),
      companyId: input.companyId,
      userId: input.userId,
      role: input.role ?? "STAFF",
      branchId: input.branchId ?? null,
      departmentId: input.departmentId ?? null,
      joinedAt: new Date(),
    };
    this.byId.set(member.id, member);
    return member;
  }

  async findById(id: string): Promise<CompanyMember | null> {
    return this.byId.get(id) ?? null;
  }

  async findByCompanyAndUser(companyId: string, userId: string): Promise<CompanyMember | null> {
    return [...this.byId.values()].find((m) => m.companyId === companyId && m.userId === userId) ?? null;
  }

  async listByCompanyId(companyId: string): Promise<CompanyMember[]> {
    return [...this.byId.values()].filter((m) => m.companyId === companyId);
  }

  async updateRole(id: string, role: CompanyMember["role"]): Promise<CompanyMember> {
    const existing = this.byId.get(id);
    if (!existing) throw new Error("not found");
    existing.role = role;
    return existing;
  }

  async remove(id: string): Promise<void> {
    this.byId.delete(id);
  }
}

export class FakeCompanyInvitationRepository implements CompanyInvitationRepository {
  private readonly byId = new Map<string, CompanyInvitation>();

  async create(input: CreateCompanyInvitationInput): Promise<CompanyInvitation> {
    const invitation: CompanyInvitation = {
      id: randomUUID(),
      companyId: input.companyId,
      invitedPhone: input.invitedPhone,
      role: input.role ?? "STAFF",
      status: "PENDING",
      invitedById: input.invitedById,
      expiresAt: input.expiresAt,
      respondedAt: null,
      createdAt: new Date(),
    };
    this.byId.set(invitation.id, invitation);
    return invitation;
  }

  async findById(id: string): Promise<CompanyInvitation | null> {
    return this.byId.get(id) ?? null;
  }

  async findPendingByPhone(phone: string): Promise<CompanyInvitation[]> {
    return [...this.byId.values()].filter((i) => i.invitedPhone === phone && i.status === "PENDING");
  }

  async listByCompanyId(companyId: string): Promise<CompanyInvitation[]> {
    return [...this.byId.values()].filter((i) => i.companyId === companyId);
  }

  async updateStatus(
    id: string,
    status: CompanyInvitationStatus,
    details?: { respondedAt?: Date },
  ): Promise<CompanyInvitation> {
    const existing = this.byId.get(id);
    if (!existing) throw new Error("not found");
    existing.status = status;
    existing.respondedAt = details?.respondedAt ?? existing.respondedAt;
    return existing;
  }
}

export class FakeCompanyDocumentRepository implements CompanyDocumentRepository {
  private readonly byId = new Map<string, CompanyDocument>();

  async create(input: CreateCompanyDocumentInput): Promise<CompanyDocument> {
    const document: CompanyDocument = {
      id: randomUUID(),
      companyId: input.companyId,
      type: input.type,
      fileUrl: input.fileUrl,
      status: "PENDING",
      reviewedAt: null,
      createdAt: new Date(),
    };
    this.byId.set(document.id, document);
    return document;
  }

  async findById(id: string): Promise<CompanyDocument | null> {
    return this.byId.get(id) ?? null;
  }

  async listByCompanyId(companyId: string): Promise<CompanyDocument[]> {
    return [...this.byId.values()].filter((d) => d.companyId === companyId);
  }

  async countByCompanyId(companyId: string): Promise<number> {
    return [...this.byId.values()].filter((d) => d.companyId === companyId).length;
  }

  async updateStatus(id: string, status: CompanyDocumentStatus): Promise<CompanyDocument> {
    const existing = this.byId.get(id);
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
