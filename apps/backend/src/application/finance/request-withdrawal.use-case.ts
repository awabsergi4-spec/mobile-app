import type { WalletRepository } from "@/domain/finance/wallet-repository";
import type { WithdrawalRecord, WithdrawalRepository } from "@/domain/finance/withdrawal-repository";
import type { WithdrawalMethod } from "@prisma/client";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import { InsufficientWalletBalanceError, WalletFrozenError } from "./errors";

export interface RequestWithdrawalInput {
  providerId: string;
  walletId: string;
  amount: number;
  feeMinorUnits?: number;
  currency: string;
  method: WithdrawalMethod;
}

// Never allow withdrawing LOCKED, PENDING, or escrowed funds (Financial
// Core Phase 7) — enforced structurally, not just by convention: the
// requested amount is atomically moved OUT of the AVAILABLE bucket via
// WalletRepository.tryDebitBalance (fails closed on insufficient funds,
// same conditional-UPDATE shape as every other money-safety fix this
// project has made) and INTO LOCKED the instant the request is accepted,
// so the same funds can never be claimed by a second concurrent
// withdrawal or spent elsewhere while this one is pending. No ledger
// entry: moving between two buckets of the same wallet doesn't change
// what the platform owes this provider in total (PROVIDER_WALLETS_PAYABLE
// is unaffected), only how much of it is currently spoken for.
export class RequestWithdrawalUseCase {
  constructor(
    private readonly wallets: WalletRepository,
    private readonly withdrawals: WithdrawalRepository,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: RequestWithdrawalInput): Promise<WithdrawalRecord> {
    const wallet = await this.wallets.findById(input.walletId);
    if (wallet?.isFrozen) {
      throw new WalletFrozenError();
    }

    const totalHold = input.amount + (input.feeMinorUnits ?? 0);
    const debited = await this.wallets.tryDebitBalance(input.walletId, "AVAILABLE", totalHold);
    if (!debited) {
      throw new InsufficientWalletBalanceError("AVAILABLE");
    }

    await this.wallets.adjustBalance(input.walletId, "LOCKED", totalHold);

    const withdrawal = await this.withdrawals.create({
      providerId: input.providerId,
      walletId: input.walletId,
      amount: input.amount,
      feeMinorUnits: input.feeMinorUnits,
      currency: input.currency,
      method: input.method,
    });

    await this.events.publish({
      type: "WithdrawalRequested",
      payload: { amount: input.amount, currency: input.currency, method: input.method },
      relatedEntityType: "WITHDRAWAL",
      relatedEntityId: withdrawal.id,
    });

    return withdrawal;
  }
}
