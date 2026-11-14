import type { WorkflowActionContext, WorkflowActionExecutor, WorkflowActionResult } from "@/domain/workflow/workflow-action-executor";
import { ReleaseEscrowUseCase } from "@/application/finance/release-escrow.use-case";
import { EscrowNotHeldError, EscrowReleaseConflictError, InvalidReleaseAmountError } from "@/application/finance/errors";

// Demonstrates ADR-009's core claim: the workflow engine invokes the
// Financial Core's existing use cases (ADR-008), it never reimplements
// escrow logic. actionConfig carries only what the workflow step decided
// (which wallet, what commission rate) — the release mechanics themselves
// are entirely ReleaseEscrowUseCase's.
export class ReleaseEscrowActionExecutor implements WorkflowActionExecutor {
  constructor(private readonly releaseEscrow: ReleaseEscrowUseCase) {}

  async execute(context: WorkflowActionContext): Promise<WorkflowActionResult> {
    const { providerWalletId, commissionPercentage, gatewayProvider } = context.actionConfig as {
      providerWalletId: string;
      commissionPercentage: number;
      gatewayProvider: string;
    };

    try {
      const result = await this.releaseEscrow.execute({
        escrowId: context.relatedEntityId,
        providerWalletId,
        commissionPercentage,
        gatewayProvider,
      });
      return { success: true, result };
    } catch (err) {
      if (err instanceof EscrowNotHeldError || err instanceof EscrowReleaseConflictError || err instanceof InvalidReleaseAmountError) {
        return { success: false, errorMessage: err.message };
      }
      throw err;
    }
  }
}
