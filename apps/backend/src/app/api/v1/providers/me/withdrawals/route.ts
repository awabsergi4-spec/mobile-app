import { NextRequest } from "next/server";
import { requestWithdrawalSchema } from "@sahl/shared/schemas/finance.schema";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { providerProfileRepository } from "@/infrastructure/provider/provider-services";
import { requestWithdrawalUseCase, walletRepository, withdrawalRepository } from "@/infrastructure/finance/finance-services";
import { prisma } from "@/infrastructure/prisma-client";
import { InsufficientWalletBalanceError, WalletFrozenError } from "@/application/finance/errors";
import { ok, fail } from "@/presentation/http-response";

// Provider-facing entry point into the Withdrawal lifecycle (Financial
// Core Phase 7) — the admin approve/reject/mark-paid routes have nothing
// to act on without this. Currency is never taken from the client: it's
// resolved from the caller's own wallet, which was created in their
// region's default currency.
export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req, tokenService);

    const profile = await providerProfileRepository.findByUserId(userId);
    if (!profile) {
      return fail("PROVIDER_PROFILE_NOT_FOUND", "No provider profile for this account", { status: 404 });
    }

    const cursor = req.nextUrl.searchParams.get("cursor");
    const limitParam = req.nextUrl.searchParams.get("limit");
    const withdrawals = await withdrawalRepository.listByProviderId(profile.id, {
      limit: limitParam ? Number(limitParam) : undefined,
      cursor: cursor ?? undefined,
    });

    return ok(withdrawals);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req, tokenService);

    const profile = await providerProfileRepository.findByUserId(userId);
    if (!profile) {
      return fail("PROVIDER_PROFILE_NOT_FOUND", "No provider profile for this account", { status: 404 });
    }

    const body = await req.json();
    const parsed = requestWithdrawalSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return fail("USER_NOT_FOUND", "User not found", { status: 404 });
    }
    const region = await prisma.region.findUnique({ where: { id: user.regionId } });
    if (!region) {
      return fail("REGION_NOT_FOUND", "Region not found for this account", { status: 500 });
    }

    const wallet = await walletRepository.getOrCreateForUser(userId, region.defaultCurrency);

    const withdrawal = await requestWithdrawalUseCase.execute({
      providerId: profile.id,
      walletId: wallet.id,
      amount: parsed.data.amount,
      currency: region.defaultCurrency,
      method: parsed.data.method,
    });

    return ok(withdrawal, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof WalletFrozenError) {
      return fail("WALLET_FROZEN", err.message, { status: 403 });
    }
    if (err instanceof InsufficientWalletBalanceError) {
      return fail("INSUFFICIENT_BALANCE", err.message, { status: 409 });
    }
    throw err;
  }
}
