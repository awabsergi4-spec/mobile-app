export type AssignmentStatus = "OFFERED" | "ACCEPTED" | "DECLINED" | "EXPIRED";

export interface OnDemandAssignment {
  id: string;
  requestId: string;
  providerId: string;
  status: AssignmentStatus;
  offeredAt: Date;
  respondedAt: Date | null;
  quotedPrice: number | null;
}

export interface CreateOnDemandAssignmentInput {
  requestId: string;
  providerId: string;
  quotedPrice?: number;
}

// Interface only — implemented in infrastructure/on-demand/prisma-on-demand-assignment.repository.ts.
export interface ListByProviderFilter {
  status?: AssignmentStatus;
  limit?: number;
}

export interface OnDemandAssignmentRepository {
  create(input: CreateOnDemandAssignmentInput): Promise<OnDemandAssignment>;
  findById(id: string): Promise<OnDemandAssignment | null>;
  listByRequestId(requestId: string): Promise<OnDemandAssignment[]>;
  // What Flutter's provider-side "incoming job offers" list needs — every
  // assignment ever offered to this provider, most recent first.
  listByProviderId(providerId: string, filter: ListByProviderFilter): Promise<OnDemandAssignment[]>;
  updateStatus(id: string, status: AssignmentStatus, details?: { respondedAt?: Date }): Promise<OnDemandAssignment>;
  // Marks every OFFERED assignment for a request EXPIRED except the one
  // just accepted — one call rather than a caller loop, since it's a
  // single bulk UPDATE at the Prisma layer.
  expirePendingOffers(requestId: string, exceptAssignmentId: string): Promise<void>;
  // Atomic conditional transition (UPDATE ... WHERE id = ? AND status = ?)
  // — returns false if the row wasn't in `fromStatus` when the write ran.
  // Accept/Decline both need this instead of read-then-write: without it,
  // a provider double-tapping accept (or an accept racing a decline) could
  // both pass the "is this still OFFERED" check before either commits.
  compareAndSetStatus(
    id: string,
    fromStatus: AssignmentStatus,
    toStatus: AssignmentStatus,
    details?: { respondedAt?: Date },
  ): Promise<boolean>;
}
