import { NextRequest } from "next/server";
import { markWithdrawalPaidSchema } from "@sahl/shared/schemas/finance.schema";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { markWithdrawalPaidUseCase } from "@/infrastructure/finance/finance-services";
import { auditLogWriter } from "@/infrastructure/provider/provider-services";
import { InvalidWithdrawalStatusTransitionError, WithdrawalNotFoundError } from "@/application/finance/errors";
import { ok, fail } from "@/presentation/http-response";

// idempotencyKey is deterministic per withdrawal (not a client-supplied
// nonce) — a retried or double-clicked mark-paid for the same withdrawal
// must land on the exact same PaymentTransaction, not create a second one.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requirePermission(req, "finance.manage", tokenService, staffPermissionRepository);
    const { id } = await params;

    const body = await req.json();
    const parsed = markWithdrawalPaidSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    await markWithdrawalPaidUseCase.execute({
      withdrawalId: id,
      gatewayProvider: parsed.data.gatewayProvider,
      gatewayRef: parsed.data.gatewayRef,
      idempotencyKey: `withdrawal-paid:${id}`,
    });

    await auditLogWriter.write({
      actorId: userId,
      action: "withdrawal.mark-paid",
      entityType: "Withdrawal",
      entityId: id,
      metadata: { gatewayProvider: parsed.data.gatewayProvider, gatewayRef: parsed.data.gatewayRef },
    });

    return ok({ status: "PAID" });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    if (err instanceof WithdrawalNotFoundError) {
      return fail("WITHDRAWAL_NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof InvalidWithdrawalStatusTransitionError) {
      return fail("INVALID_STATUS_TRANSITION", err.message, { status: 409 });
    }
    throw err;
  }
}
