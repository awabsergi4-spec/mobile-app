export type RevisionStatus = "REQUESTED" | "IN_PROGRESS" | "RESOLVED";

export interface RemoteRevision {
  id: string;
  engagementId: string;
  requestedBy: string;
  notes: string;
  status: RevisionStatus;
  createdAt: Date;
}

export interface CreateRemoteRevisionInput {
  engagementId: string;
  requestedBy: string;
  notes: string;
}

// Interface only — implemented in infrastructure/remote/prisma-remote-revision.repository.ts.
export interface RemoteRevisionRepository {
  create(input: CreateRemoteRevisionInput): Promise<RemoteRevision>;
  findById(id: string): Promise<RemoteRevision | null>;
  listByEngagementId(engagementId: string): Promise<RemoteRevision[]>;
  updateStatus(id: string, status: RevisionStatus): Promise<RemoteRevision>;
}
