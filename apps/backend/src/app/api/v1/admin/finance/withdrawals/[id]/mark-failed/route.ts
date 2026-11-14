import { NextRequest } from "next/server";
import { markWithdrawalFailedSchema } from "@sahl/shared/schemas/finance.schema";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { markWithdrawalFailedUseCase } from "@/infrastructure/finance/finance-services";
import { auditLogWriter } from "@/infrastructure/provider/provider-services";
import { InvalidWithdrawalStatusTransitionError, WithdrawalNotFoundError } from "@/application/finance/errors";
import { ok, fail } from "@/presentation/http-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requirePermission(req, "finance.manage", tokenService, staffPermissionRepository);
    const { id } = await params;

    const body = await req.json();
    const parsed = markWithdrawalFailedSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    await markWithdrawalFailedUseCase.execute({ withdrawalId: id, reason: parsed.data.reason });

    await auditLogWriter.write({
      actorId: userId,
      action: "withdrawal.mark-failed",
      entityType: "Withdrawal",
      entityId: id,
      metadata: { reason: parsed.data.reason },
    });

    return ok({ status: "FAILED" });
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
