import { NextRequest } from "next/server";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { completeSettlementUseCase } from "@/infrastructure/finance/finance-services";
import { auditLogWriter } from "@/infrastructure/provider/provider-services";
import { InvalidSettlementStatusTransitionError, SettlementNotFoundError } from "@/application/finance/errors";
import { ok, fail } from "@/presentation/http-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requirePermission(req, "finance.manage", tokenService, staffPermissionRepository);
    const { id } = await params;

    await completeSettlementUseCase.execute({ settlementId: id });

    await auditLogWriter.write({
      actorId: userId,
      action: "settlement.complete",
      entityType: "Settlement",
      entityId: id,
      metadata: {},
    });

    return ok({ status: "COMPLETED" });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    if (err instanceof SettlementNotFoundError) {
      return fail("SETTLEMENT_NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof InvalidSettlementStatusTransitionError) {
      return fail("INVALID_STATUS_TRANSITION", err.message, { status: 409 });
    }
    throw err;
  }
}
