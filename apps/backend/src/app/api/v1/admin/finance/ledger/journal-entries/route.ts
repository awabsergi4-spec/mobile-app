import { NextRequest } from "next/server";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { ledgerService } from "@/infrastructure/finance/finance-services";
import { ok, fail } from "@/presentation/http-response";

export async function GET(req: NextRequest) {
  try {
    await requirePermission(req, "finance.manage", tokenService, staffPermissionRepository);
    const params = req.nextUrl.searchParams;

    const entries = await ledgerService.listJournalEntries({
      relatedEntityType: params.get("relatedEntityType") ?? undefined,
      relatedEntityId: params.get("relatedEntityId") ?? undefined,
      ledgerAccountCode: params.get("ledgerAccountCode") ?? undefined,
      limit: params.get("limit") ? Number(params.get("limit")) : undefined,
      cursor: params.get("cursor") ?? undefined,
    });
    return ok(entries);
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
