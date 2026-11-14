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
import type { ContractProject, ContractProjectStatus } from "@/domain/contract/contract-project.entity";
import type {
  ContractProjectRepository,
  CreateContractProjectInput,
  ListByCustomerFilter,
} from "@/domain/contract/contract-project.repository";
import type {
  BidStatus,
  ContractBid,
  ContractBidRepository,
  CreateContractBidInput,
  ListByProviderFilter,
} from "@/domain/contract/contract-bid.repository";
import type { Contract, ContractStatus } from "@/domain/contract/contract.entity";
import type { ContractRepository, CreateContractInput } from "@/domain/contract/contract.repository";
import type {
  ContractMilestone,
  ContractMilestoneRepository,
  CreateContractMilestoneInput,
  MilestoneStatus,
} from "@/domain/contract/contract-milestone.repository";
import type { DomainEventPublisher, PublishDomainEventInput } from "@/domain/workflow/domain-event-publisher";

export class FakeContractProjectRepository implements ContractProjectRepository {
  private readonly byId = new Map<string, ContractProject>();

  async create(input: CreateContractProjectInput): Promise<ContractProject> {
    const project: ContractProject = {
      id: randomUUID(),
      customerId: input.customerId,
      companyId: input.companyId ?? null,
      categoryId: input.categoryId,
      title: input.title,
      description: input.description,
      budgetMin: input.budgetMin ?? null,
      budgetMax: input.budgetMax ?? null,
      status: "OPEN_FOR_BIDS",
      createdAt: new Date(),
    };
    this.byId.set(project.id, project);
    return project;
  }

  async findById(id: string): Promise<ContractProject | null> {
    return this.byId.get(id) ?? null;
  }

  async updateStatus(id: string, status: ContractProjectStatus): Promise<ContractProject> {
    const existing = this.byId.get(id);
    if (!existing) throw new Error("not found");
    existing.status = status;
    return existing;
  }

  async compareAndSetStatus(id: string, fromStatus: ContractProjectStatus, toStatus: ContractProjectStatus): Promise<boolean> {
    const existing = this.byId.get(id);
    if (!existing || existing.status !== fromStatus) return false;
    existing.status = toStatus;
    return true;
  }

  async search(): Promise<ContractProject[]> {
    return [...this.byId.values()];
  }

  async listByCustomerId(customerId: string, filter: ListByCustomerFilter): Promise<ContractProject[]> {
    return [...this.byId.values()].filter((p) => p.customerId === customerId && (!filter.status || p.status === filter.status));
  }
}

export class FakeContractBidRepository implements ContractBidRepository {
  private readonly byId = new Map<string, ContractBid>();

  async create(input: CreateContractBidInput): Promise<ContractBid> {
    const bid: ContractBid = {
      id: randomUUID(),
      projectId: input.projectId,
      providerId: input.providerId,
      amount: input.amount,
      message: input.message ?? null,
      status: "SUBMITTED",
      submittedAt: new Date(),
    };
    this.byId.set(bid.id, bid);
    return bid;
  }

  async findById(id: string): Promise<ContractBid | null> {
    return this.byId.get(id) ?? null;
  }

  async listByProjectId(projectId: string): Promise<ContractBid[]> {
    return [...this.byId.values()].filter((b) => b.projectId === projectId);
  }

  async listByProviderId(providerId: string, filter: ListByProviderFilter): Promise<ContractBid[]> {
    return [...this.byId.values()].filter((b) => b.providerId === providerId && (!filter.status || b.status === filter.status));
  }

  async updateStatus(id: string, status: BidStatus): Promise<ContractBid> {
    const existing = this.byId.get(id);
    if (!existing) throw new Error("not found");
    existing.status = status;
    return existing;
  }

  async rejectOtherSubmittedBids(projectId: string, exceptBidId: string): Promise<void> {
    for (const bid of this.byId.values()) {
      if (bid.projectId === projectId && bid.status === "SUBMITTED" && bid.id !== exceptBidId) {
        bid.status = "REJECTED";
      }
    }
  }
}

export class FakeContractRepository implements ContractRepository {
  private readonly byId = new Map<string, Contract>();
  private readonly byProjectId = new Map<string, string>();

  async create(input: CreateContractInput): Promise<Contract> {
    const contract: Contract = {
      id: randomUUID(),
      projectId: input.projectId,
      providerId: input.providerId,
      totalAmount: input.totalAmount,
      status: "IN_PROGRESS",
      startedAt: new Date(),
      completedAt: null,
    };
    this.byId.set(contract.id, contract);
    this.byProjectId.set(input.projectId, contract.id);
    return contract;
  }

  async findById(id: string): Promise<Contract | null> {
    return this.byId.get(id) ?? null;
  }

  async findByProjectId(projectId: string): Promise<Contract | null> {
    const id = this.byProjectId.get(projectId);
    return id ? (this.byId.get(id) ?? null) : null;
  }

  async updateStatus(id: string, status: ContractStatus, details?: { completedAt?: Date }): Promise<Contract> {
    const existing = this.byId.get(id);
    if (!existing) throw new Error("not found");
    existing.status = status;
    if (details?.completedAt) existing.completedAt = details.completedAt;
    return existing;
  }
}

export class FakeContractMilestoneRepository implements ContractMilestoneRepository {
  private readonly byId = new Map<string, ContractMilestone>();

  async create(input: CreateContractMilestoneInput): Promise<ContractMilestone> {
    const milestone: ContractMilestone = {
      id: randomUUID(),
      contractId: input.contractId,
      title: input.title,
      amount: input.amount,
      status: "PENDING",
      dueDate: input.dueDate ?? null,
    };
    this.byId.set(milestone.id, milestone);
    return milestone;
  }

  async findById(id: string): Promise<ContractMilestone | null> {
    return this.byId.get(id) ?? null;
  }

  async listByContractId(contractId: string): Promise<ContractMilestone[]> {
    return [...this.byId.values()].filter((m) => m.contractId === contractId);
  }

  async updateStatus(id: string, status: MilestoneStatus): Promise<ContractMilestone> {
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

// Minimal fake — only findById is exercised by the Contract use cases'
// eligibility check (SubmitContractBidUseCase, AwardContractBidUseCase).
// seedEligible() covers the common case; seed() allows an ineligible
// provider (SUSPENDED/UNVERIFIED) to be constructed for the negative tests.
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
