import { NextRequest } from "next/server";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { withdrawalRepository } from "@/infrastructure/finance/finance-services";
import { ok, fail } from "@/presentation/http-response";
import type { WithdrawalStatus } from "@prisma/client";

const VALID_STATUSES: WithdrawalStatus[] = ["REQUESTED", "PENDING_APPROVAL", "APPROVED", "REJECTED", "PROCESSING", "PAID", "FAILED"];

export async function GET(req: NextRequest) {
  try {
    await requirePermission(req, "finance.manage", tokenService, staffPermissionRepository);

    const statusParam = req.nextUrl.searchParams.get("status") ?? "REQUESTED";
    if (!VALID_STATUSES.includes(statusParam as WithdrawalStatus)) {
      return fail("VALIDATION_ERROR", "Invalid status filter", { status: 400 });
    }
    const cursor = req.nextUrl.searchParams.get("cursor");
    const limitParam = req.nextUrl.searchParams.get("limit");

    const withdrawals = await withdrawalRepository.listByStatus(statusParam as WithdrawalStatus, {
      limit: limitParam ? Number(limitParam) : undefined,
      cursor: cursor ?? undefined,
    });

    return ok(withdrawals);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    throw err;
  }
}
