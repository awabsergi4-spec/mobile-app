import { NextRequest } from "next/server";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { walletRepository } from "@/infrastructure/finance/finance-services";
import { ok, fail } from "@/presentation/http-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ walletId: string }> }) {
  try {
    await requirePermission(req, "finance.manage", tokenService, staffPermissionRepository);
    const { walletId } = await params;

    const wallet = await walletRepository.findById(walletId);
    if (!wallet) {
      return fail("WALLET_NOT_FOUND", "Wallet not found", { status: 404 });
    }
    const balances = await walletRepository.listBalances(walletId);

    return ok({ ...wallet, balances });
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
