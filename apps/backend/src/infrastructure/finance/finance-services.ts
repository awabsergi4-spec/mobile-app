import { prisma } from "@/infrastructure/prisma-client";
import { PrismaLedgerService } from "./prisma-ledger-service";
import { PrismaWalletRepository } from "./prisma-wallet-repository";
import { PrismaEscrowRepository } from "./prisma-escrow-repository";
import { PrismaTransactionRecorder } from "./prisma-transaction-recorder";
import { PrismaCommissionCalculator } from "./prisma-commission-calculator";
import { PrismaWithdrawalRepository } from "./prisma-withdrawal-repository";
import { PrismaSettlementRepository } from "./prisma-settlement-repository";
import { PrismaFinanceReportingService } from "./prisma-finance-reporting";
import { PaymentProviderRegistry } from "@/infrastructure/payments/payment-provider-registry";
import { domainEventPublisher, auditLogWriter } from "@/infrastructure/provider/provider-services";
import { InitiatePaymentUseCase } from "@/application/finance/initiate-payment.use-case";
import { CapturePaymentUseCase } from "@/application/finance/capture-payment.use-case";
import { FundEscrowUseCase } from "@/application/finance/fund-escrow.use-case";
import { ReleaseEscrowUseCase } from "@/application/finance/release-escrow.use-case";
import { RefundEscrowUseCase } from "@/application/finance/refund-escrow.use-case";
import { CancelEscrowUseCase } from "@/application/finance/cancel-escrow.use-case";
import { ExpireEscrowUseCase } from "@/application/finance/expire-escrow.use-case";
import { RefundPaymentUseCase } from "@/application/finance/refund-payment.use-case";
import { RequestWithdrawalUseCase } from "@/application/finance/request-withdrawal.use-case";
import { ApproveWithdrawalUseCase } from "@/application/finance/approve-withdrawal.use-case";
import { RejectWithdrawalUseCase } from "@/application/finance/reject-withdrawal.use-case";
import { MarkWithdrawalPaidUseCase } from "@/application/finance/mark-withdrawal-paid.use-case";
import { MarkWithdrawalFailedUseCase } from "@/application/finance/mark-withdrawal-failed.use-case";
import { CreateSettlementUseCase } from "@/application/finance/create-settlement.use-case";
import { CompleteSettlementUseCase } from "@/application/finance/complete-settlement.use-case";
import { ProcessPaymentWebhookUseCase } from "@/application/finance/process-payment-webhook.use-case";

// Wires the Financial Core's infrastructure once per process — same
// singleton convention as every other module's *-services.ts file. This
// is the one place all of Ledger/Wallet/Payment/Escrow/Commission/
// Withdrawal/Settlement get assembled; every route and every other
// module's service-integration code imports use cases from here rather
// than constructing its own Financial Core object graph.
export const ledgerService = new PrismaLedgerService(prisma);
export const walletRepository = new PrismaWalletRepository(prisma);
export const escrowRepository = new PrismaEscrowRepository(prisma);
export const transactionRecorder = new PrismaTransactionRecorder(prisma);
export const commissionCalculator = new PrismaCommissionCalculator(prisma);
export const withdrawalRepository = new PrismaWithdrawalRepository(prisma);
export const settlementRepository = new PrismaSettlementRepository(prisma);
export const paymentProviderRegistry = new PaymentProviderRegistry(prisma);
export const financeReportingService = new PrismaFinanceReportingService(prisma);

export const initiatePaymentUseCase = new InitiatePaymentUseCase(paymentProviderRegistry, transactionRecorder);
export const capturePaymentUseCase = new CapturePaymentUseCase(paymentProviderRegistry, transactionRecorder);

export const fundEscrowUseCase = new FundEscrowUseCase(escrowRepository, ledgerService, transactionRecorder, domainEventPublisher);
export const releaseEscrowUseCase = new ReleaseEscrowUseCase(
  escrowRepository,
  ledgerService,
  walletRepository,
  transactionRecorder,
  domainEventPublisher,
);
export const refundEscrowUseCase = new RefundEscrowUseCase(
  escrowRepository,
  ledgerService,
  transactionRecorder,
  domainEventPublisher,
);
export const cancelEscrowUseCase = new CancelEscrowUseCase(
  escrowRepository,
  ledgerService,
  transactionRecorder,
  domainEventPublisher,
);
export const expireEscrowUseCase = new ExpireEscrowUseCase(
  escrowRepository,
  ledgerService,
  transactionRecorder,
  domainEventPublisher,
);
export const refundPaymentUseCase = new RefundPaymentUseCase(
  escrowRepository,
  refundEscrowUseCase,
  transactionRecorder,
  paymentProviderRegistry,
);

export const requestWithdrawalUseCase = new RequestWithdrawalUseCase(walletRepository, withdrawalRepository, domainEventPublisher);
export const approveWithdrawalUseCase = new ApproveWithdrawalUseCase(withdrawalRepository, auditLogWriter, domainEventPublisher);
export const rejectWithdrawalUseCase = new RejectWithdrawalUseCase(
  withdrawalRepository,
  walletRepository,
  auditLogWriter,
  domainEventPublisher,
);
export const markWithdrawalPaidUseCase = new MarkWithdrawalPaidUseCase(
  withdrawalRepository,
  walletRepository,
  ledgerService,
  transactionRecorder,
  domainEventPublisher,
);
export const markWithdrawalFailedUseCase = new MarkWithdrawalFailedUseCase(withdrawalRepository, walletRepository, domainEventPublisher);

export const createSettlementUseCase = new CreateSettlementUseCase(settlementRepository, withdrawalRepository, domainEventPublisher);
export const completeSettlementUseCase = new CompleteSettlementUseCase(settlementRepository, domainEventPublisher);

export const processPaymentWebhookUseCase = new ProcessPaymentWebhookUseCase(
  paymentProviderRegistry,
  transactionRecorder,
  auditLogWriter,
  domainEventPublisher,
);
