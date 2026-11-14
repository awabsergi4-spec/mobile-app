import { randomUUID } from "crypto";
import type { DisputeStatus } from "@prisma/client";
import type { CreateDisputeInput, DisputeRecord, DisputeRepository } from "@/domain/dispute/dispute-repository";

export class FakeDisputeRepository implements DisputeRepository {
  private readonly byId = new Map<string, DisputeRecord>();

  async create(input: CreateDisputeInput): Promise<DisputeRecord> {
    const dispute: DisputeRecord = {
      id: randomUUID(),
      raisedById: input.raisedById,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
      reason: input.reason,
      status: "OPEN",
      resolutionNotes: null,
    };
    this.byId.set(dispute.id, dispute);
    return dispute;
  }

  async findById(id: string): Promise<DisputeRecord | null> {
    return this.byId.get(id) ?? null;
  }

  async compareAndSetStatus(id: string, fromStatus: DisputeStatus, toStatus: DisputeStatus, resolutionNotes?: string): Promise<boolean> {
    const dispute = this.byId.get(id);
    if (!dispute || dispute.status !== fromStatus) return false;
    dispute.status = toStatus;
    if (resolutionNotes) dispute.resolutionNotes = resolutionNotes;
    return true;
  }

  async listByStatus(status: DisputeStatus): Promise<DisputeRecord[]> {
    return [...this.byId.values()].filter((d) => d.status === status);
  }

  async listByRaisedById(raisedById: string): Promise<DisputeRecord[]> {
    return [...this.byId.values()].filter((d) => d.raisedById === raisedById);
  }
}
