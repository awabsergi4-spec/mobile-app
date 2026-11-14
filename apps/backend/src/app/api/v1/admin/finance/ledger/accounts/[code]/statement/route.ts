import { NextRequest } from "next/server";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { financeReportingService } from "@/infrastructure/finance/finance-services";
import { ok, fail } from "@/presentation/http-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    await requirePermission(req, "finance.manage", tokenService, staffPermissionRepository);
    const { code } = await params;
    const limitParam = req.nextUrl.searchParams.get("limit");

    const statement = await financeReportingService.getAccountStatement(code, {
      limit: limitParam ? Number(limitParam) : undefined,
    });
    return ok(statement);
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
