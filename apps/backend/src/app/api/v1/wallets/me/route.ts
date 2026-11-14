import { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { walletRepository } from "@/infrastructure/finance/finance-services";
import { prisma } from "@/infrastructure/prisma-client";
import { ok, fail } from "@/presentation/http-response";

// Auto-creates the caller's wallet on first access (getOrCreateForUser) —
// there's no separate "open a wallet" step for a User; every account
// implicitly has one once it needs one.
export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req, tokenService);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return fail("USER_NOT_FOUND", "User not found", { status: 404 });
    }
    const region = await prisma.region.findUnique({ where: { id: user.regionId } });
    if (!region) {
      return fail("REGION_NOT_FOUND", "Region not found for this account", { status: 500 });
    }

    const wallet = await walletRepository.getOrCreateForUser(userId, region.defaultCurrency);
    const balances = await walletRepository.listBalances(wallet.id);

    return ok({ ...wallet, balances });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    throw err;
  }
}
