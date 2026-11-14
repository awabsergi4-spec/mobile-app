// Reuses MilestoneStatus's meaning exactly (PENDING → IN_PROGRESS →
// SUBMITTED → APPROVED → PAID), same as ContractMilestone — declared here
// as its own type rather than imported from domain/contract, keeping
// Remote and Contract independent bounded contexts (same reasoning as
// domain/company's structurally-identical-but-separate lifecycle types).
export type MilestoneStatus = "PENDING" | "IN_PROGRESS" | "SUBMITTED" | "APPROVED" | "PAID";

export interface RemoteMilestone {
  id: string;
  engagementId: string;
  title: string;
  amount: number;
  status: MilestoneStatus;
  dueDate: Date | null;
}

export interface CreateRemoteMilestoneInput {
  engagementId: string;
  title: string;
  amount: number;
  dueDate?: Date;
}

// Interface only — implemented in infrastructure/remote/prisma-remote-milestone.repository.ts.
export interface RemoteMilestoneRepository {
  create(input: CreateRemoteMilestoneInput): Promise<RemoteMilestone>;
  findById(id: string): Promise<RemoteMilestone | null>;
  listByEngagementId(engagementId: string): Promise<RemoteMilestone[]>;
  updateStatus(id: string, status: MilestoneStatus): Promise<RemoteMilestone>;
}
