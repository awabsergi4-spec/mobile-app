import { NextRequest } from "next/server";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { approveWithdrawalUseCase } from "@/infrastructure/finance/finance-services";
import { InvalidWithdrawalStatusTransitionError, WithdrawalNotFoundError } from "@/application/finance/errors";
import { ok, fail } from "@/presentation/http-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requirePermission(req, "finance.manage", tokenService, staffPermissionRepository);
    const { id } = await params;

    await approveWithdrawalUseCase.execute({ withdrawalId: id, approvedById: userId });
    return ok({ status: "APPROVED" });
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
