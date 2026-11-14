import { NextRequest } from "next/server";
import { rejectWithdrawalSchema } from "@sahl/shared/schemas/finance.schema";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { rejectWithdrawalUseCase } from "@/infrastructure/finance/finance-services";
import { InvalidWithdrawalStatusTransitionError, WithdrawalNotFoundError } from "@/application/finance/errors";
import { ok, fail } from "@/presentation/http-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requirePermission(req, "finance.manage", tokenService, staffPermissionRepository);
    const { id } = await params;

    const body = await req.json();
    const parsed = rejectWithdrawalSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    await rejectWithdrawalUseCase.execute({ withdrawalId: id, rejectedById: userId, reason: parsed.data.reason });
    return ok({ status: "REJECTED" });
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
