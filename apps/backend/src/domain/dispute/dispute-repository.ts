import type { DisputeStatus } from "@prisma/client";

export interface DisputeRecord {
  id: string;
  raisedById: string;
  relatedEntityType: string;
  relatedEntityId: string;
  reason: string;
  status: DisputeStatus;
  resolutionNotes: string | null;
}

export interface CreateDisputeInput {
  raisedById: string;
  relatedEntityType: string;
  relatedEntityId: string;
  reason: string;
}

// Interface only, scoped to what escrow-dispute integration needs (open,
// resolve) — the full Trust & Safety Dispute module (evidence upload,
// staff triage queue, notifications) is a separate, larger bounded
// context this round doesn't build out.
export interface DisputeRepository {
  create(input: CreateDisputeInput): Promise<DisputeRecord>;
  findById(id: string): Promise<DisputeRecord | null>;
  compareAndSetStatus(
    id: string,
    fromStatus: DisputeStatus,
    toStatus: DisputeStatus,
    resolutionNotes?: string,
  ): Promise<boolean>;
  // Admin triage queue — the only place a Dispute is found other than by
  // its own id.
  listByStatus(status: DisputeStatus, filter?: { limit?: number }): Promise<DisputeRecord[]>;
  // What Flutter's "My Disputes" list needs — the caller's own disputes,
  // regardless of status.
  listByRaisedById(raisedById: string, filter?: { limit?: number }): Promise<DisputeRecord[]>;
}
