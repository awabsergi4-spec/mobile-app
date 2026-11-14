import { NextRequest } from "next/server";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { financeReportingService } from "@/infrastructure/finance/finance-services";
import { ok, fail } from "@/presentation/http-response";

// Reports discrepancies rather than correcting them (Financial Core
// Phase 15) — a non-zero `discrepancy` on either check means investigate,
// not "click here to fix."
export async function GET(req: NextRequest) {
  try {
    await requirePermission(req, "finance.manage", tokenService, staffPermissionRepository);
    const currency = req.nextUrl.searchParams.get("currency");
    if (!currency) {
      return fail("VALIDATION_ERROR", "currency query parameter is required", { status: 400 });
    }

    const [wallets, escrow] = await Promise.all([
      financeReportingService.reconcileWalletBalances(currency),
      financeReportingService.reconcileEscrowHoldings(currency),
    ]);

    return ok({ wallets, escrow });
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
