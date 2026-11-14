import type { PrismaClient } from "@prisma/client";
import type {
  AccountStatementLine,
  FinanceReportingService,
  ReconciliationResult,
  TrialBalanceLine,
} from "@/domain/finance/finance-reporting";

const CREDIT_NORMAL_TYPES = new Set(["LIABILITY", "EQUITY", "REVENUE"]);

export class PrismaFinanceReportingService implements FinanceReportingService {
  constructor(private readonly prisma: PrismaClient) {}

  async getTrialBalance(currency: string): Promise<TrialBalanceLine[]> {
    const accounts = await this.prisma.ledgerAccount.findMany({ where: { currency, isActive: true } });

    const lines: TrialBalanceLine[] = [];
    for (const account of accounts) {
      const journalLines = await this.prisma.journalLine.findMany({ where: { ledgerAccountId: account.id } });
      let totalDebits = 0;
      let totalCredits = 0;
      for (const line of journalLines) {
        if (line.direction === "DEBIT") totalDebits += line.amount;
        else totalCredits += line.amount;
      }
      const balance = CREDIT_NORMAL_TYPES.has(account.type) ? totalCredits - totalDebits : totalDebits - totalCredits;
      lines.push({ ledgerAccountCode: account.code, ledgerAccountName: account.name, type: account.type, currency, totalDebits, totalCredits, balance });
    }
    return lines;
  }

  async getAccountStatement(ledgerAccountCode: string, filter?: { limit?: number }): Promise<AccountStatementLine[]> {
    const account = await this.prisma.ledgerAccount.findUnique({ where: { code: ledgerAccountCode } });
    if (!account) return [];

    const lines = await this.prisma.journalLine.findMany({
      where: { ledgerAccountId: account.id },
      include: { journalEntry: true },
      orderBy: { id: "desc" },
      take: filter?.limit ?? 100,
    });

    return lines.map((line) => ({
      journalEntryId: line.journalEntryId,
      description: line.journalEntry.description,
      direction: line.direction,
      amount: line.amount,
      createdAt: line.journalEntry.createdAt,
    }));
  }

  async reconcileWalletBalances(currency: string): Promise<ReconciliationResult> {
    const balances = await this.prisma.walletBalance.findMany({ where: { wallet: { currency } } });
    const subsidiaryTotal = balances.reduce((sum, b) => sum + b.amount, 0);

    const ledgerControlBalance = await this.sumControlAccounts(
      ["CUSTOMER_WALLETS_PAYABLE", "PROVIDER_WALLETS_PAYABLE"],
      currency,
    );

    const discrepancy = subsidiaryTotal - ledgerControlBalance;
    return { currency, subsidiaryTotal, ledgerControlBalance, discrepancy, isReconciled: discrepancy === 0 };
  }

  async reconcileEscrowHoldings(currency: string): Promise<ReconciliationResult> {
    const escrows = await this.prisma.escrow.findMany({
      where: { currency, status: { in: ["HELD", "PARTIALLY_RELEASED"] } },
    });
    const subsidiaryTotal = escrows.reduce((sum, e) => sum + (e.amount - e.releasedAmount - e.refundedAmount), 0);

    const ledgerControlBalance = await this.sumControlAccounts(["ESCROW_HOLDING"], currency);

    const discrepancy = subsidiaryTotal - ledgerControlBalance;
    return { currency, subsidiaryTotal, ledgerControlBalance, discrepancy, isReconciled: discrepancy === 0 };
  }

  private async sumControlAccounts(codes: string[], currency: string): Promise<number> {
    const accounts = await this.prisma.ledgerAccount.findMany({ where: { code: { in: codes }, currency } });
    let total = 0;
    for (const account of accounts) {
      const lines = await this.prisma.journalLine.findMany({ where: { ledgerAccountId: account.id } });
      const isCreditNormal = CREDIT_NORMAL_TYPES.has(account.type);
      for (const line of lines) {
        const signedAmount = line.direction === (isCreditNormal ? "CREDIT" : "DEBIT") ? line.amount : -line.amount;
        total += signedAmount;
      }
    }
    return total;
  }
}
