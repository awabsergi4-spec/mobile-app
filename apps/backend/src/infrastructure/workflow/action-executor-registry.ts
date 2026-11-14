import type { PrismaClient, WorkflowActionType } from "@prisma/client";
import type { WorkflowActionExecutor } from "@/domain/workflow/workflow-action-executor";
import { releaseEscrowUseCase } from "@/infrastructure/finance/finance-services";
import { ReleaseEscrowActionExecutor } from "./executors/release-escrow-action-executor";
import { SendMessageActionExecutor } from "./executors/send-message-action-executor";

// Resolves a WorkflowActionExecutor per WorkflowActionType — the fourth/
// fifth application of the same adapter-plus-registry shape this codebase
// keeps reusing (PaymentProvider -> ADR-001, AIProvider -> ADR-006, now
// workflow actions -> ADR-009). Only RELEASE_ESCROW and SEND_MESSAGE are
// wired as the reference implementation; the remaining WorkflowActionType
// values follow the identical shape once each is actually needed — see
// docs/10-workflow-engine.md §7. RELEASE_ESCROW reuses the Financial
// Core's own singleton wiring (infrastructure/finance/finance-services.ts)
// rather than constructing a second set of Ledger/Wallet/Escrow/
// TransactionRecorder instances here.
export class ActionExecutorRegistry {
  constructor(private readonly prisma: PrismaClient) {}

  resolve(actionType: WorkflowActionType): WorkflowActionExecutor {
    switch (actionType) {
      case "RELEASE_ESCROW":
        return new ReleaseEscrowActionExecutor(releaseEscrowUseCase);
      case "SEND_MESSAGE":
        return new SendMessageActionExecutor(this.prisma);
      default:
        throw new Error(`No WorkflowActionExecutor registered for "${actionType}" yet`);
    }
  }
}
