import { NextRequest } from "next/server";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { escrowRepository } from "@/infrastructure/finance/finance-services";
import { ok, fail } from "@/presentation/http-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission(req, "finance.manage", tokenService, staffPermissionRepository);
    const { id } = await params;

    const escrow = await escrowRepository.findById(id);
    if (!escrow) {
      return fail("ESCROW_NOT_FOUND", "Escrow not found", { status: 404 });
    }

    return ok(escrow);
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
