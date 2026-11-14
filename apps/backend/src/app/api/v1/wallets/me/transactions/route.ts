import { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { walletRepository } from "@/infrastructure/finance/finance-services";
import { ok, fail } from "@/presentation/http-response";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req, tokenService);

    const wallet = await walletRepository.findByUserId(userId);
    if (!wallet) {
      return ok([]);
    }

    const cursor = req.nextUrl.searchParams.get("cursor");
    const limitParam = req.nextUrl.searchParams.get("limit");
    const transactions = await walletRepository.listTransactions(wallet.id, {
      limit: limitParam ? Number(limitParam) : undefined,
      cursor: cursor ?? undefined,
    });

    return ok(transactions);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    throw err;
  }
}
