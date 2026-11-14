import type { UserRepository } from "@/domain/identity/user.repository";
import type { AuditLogWriter } from "@/domain/audit/audit-log-writer";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import { UserNotFoundError } from "./errors";
import { InvalidUserStatusTransitionError } from "./suspend-user.use-case";

export interface ReactivateUserInput {
  userId: string;
  actorId: string;
}

// Only reverses SuspendUserUseCase — a BANNED account is a harder,
// deliberate decision than a suspension and is not reachable from here,
// same asymmetry as Provider's SUSPENDED->ACTIVE vs. no route back from a
// harsher status.
export class ReactivateUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly auditLog: AuditLogWriter,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: ReactivateUserInput): Promise<void> {
    const user = await this.users.findById(input.userId);
    if (!user) {
      throw new UserNotFoundError();
    }
    if (user.status !== "SUSPENDED") {
      throw new InvalidUserStatusTransitionError(user.status, "ACTIVE");
    }

    await this.users.updateStatus(input.userId, "ACTIVE");

    await this.auditLog.write({
      actorId: input.actorId,
      action: "user.reactivate",
      entityType: "User",
      entityId: input.userId,
    });

    await this.events.publish({
      type: "UserReactivated",
      payload: {},
      relatedEntityType: "USER",
      relatedEntityId: input.userId,
    });
  }
}
