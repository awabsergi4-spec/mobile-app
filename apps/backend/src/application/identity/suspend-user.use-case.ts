import type { UserRepository } from "@/domain/identity/user.repository";
import type { AuditLogWriter } from "@/domain/audit/audit-log-writer";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import { UserNotFoundError } from "./errors";

export class InvalidUserStatusTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Cannot move a user account from ${from} to ${to}`);
  }
}

export interface SuspendUserInput {
  userId: string;
  reason: string;
  actorId: string;
}

// Mirrors SuspendProviderUseCase's shape (ADR-009) — a suspended User can
// no longer authenticate (LoginWithPasswordUseCase's AccountNotActiveError
// guard already covers this, no new check needed there) regardless of
// whether they also hold a ProviderProfile/Company; this is the account
// itself, not the provider-facing lifecycle SuspendProviderUseCase governs.
export class SuspendUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly auditLog: AuditLogWriter,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: SuspendUserInput): Promise<void> {
    const user = await this.users.findById(input.userId);
    if (!user) {
      throw new UserNotFoundError();
    }
    if (user.status === "BANNED") {
      throw new InvalidUserStatusTransitionError(user.status, "SUSPENDED");
    }

    await this.users.updateStatus(input.userId, "SUSPENDED");

    await this.auditLog.write({
      actorId: input.actorId,
      action: "user.suspend",
      entityType: "User",
      entityId: input.userId,
      metadata: { reason: input.reason },
    });

    await this.events.publish({
      type: "UserSuspended",
      payload: { reason: input.reason },
      relatedEntityType: "USER",
      relatedEntityId: input.userId,
    });
  }
}
