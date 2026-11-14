import { NextRequest } from "next/server";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { ledgerService } from "@/infrastructure/finance/finance-services";
import { LedgerAccountNotFoundError } from "@/domain/finance/ledger-service";
import { ok, fail } from "@/presentation/http-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    await requirePermission(req, "finance.manage", tokenService, staffPermissionRepository);
    const { code } = await params;

    const balance = await ledgerService.getAccountBalance(code);
    return ok(balance);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    if (err instanceof LedgerAccountNotFoundError) {
      return fail("LEDGER_ACCOUNT_NOT_FOUND", err.message, { status: 404 });
    }
    throw err;
  }
}
