import { z } from "zod";

// Matches WithdrawalMethod in apps/backend/prisma/schema.prisma.
export const withdrawalMethodSchema = z.enum(["BANK_TRANSFER", "WALLET_TRANSFER", "MOBILE_MONEY"]);

export const requestWithdrawalSchema = z.object({
  amount: z.number().int().positive(),
  method: withdrawalMethodSchema,
});

export type RequestWithdrawalPayload = z.infer<typeof requestWithdrawalSchema>;

export const rejectWithdrawalSchema = z.object({
  reason: z.string().min(3).max(500),
});

export type RejectWithdrawalPayload = z.infer<typeof rejectWithdrawalSchema>;

export const markWithdrawalPaidSchema = z.object({
  gatewayProvider: z.string().min(1).max(60),
  gatewayRef: z.string().max(200).optional(),
});

export type MarkWithdrawalPaidPayload = z.infer<typeof markWithdrawalPaidSchema>;

export const markWithdrawalFailedSchema = z.object({
  reason: z.string().min(3).max(500),
});

export type MarkWithdrawalFailedPayload = z.infer<typeof markWithdrawalFailedSchema>;

// Matches SettlementSchedule in apps/backend/prisma/schema.prisma.
export const settlementScheduleSchema = z.enum(["INSTANT", "DAILY", "WEEKLY", "MONTHLY", "MANUAL"]);

export const createSettlementSchema = z.object({
  schedule: settlementScheduleSchema,
  currency: z.string().length(3),
  scheduledFor: z.coerce.date().optional(),
});

export type CreateSettlementPayload = z.infer<typeof createSettlementSchema>;

export const refundPaymentSchema = z.object({
  relatedEntityType: z.string().min(1).max(60),
  relatedEntityId: z.string().min(1),
  regionId: z.string().min(1),
  refundAmount: z.number().int().positive().optional(),
  reason: z.string().min(3).max(2000),
});

export type RefundPaymentPayload = z.infer<typeof refundPaymentSchema>;

export const openDisputeSchema = z.object({
  relatedEntityType: z.string().min(1).max(60),
  relatedEntityId: z.string().min(1),
  reason: z.string().min(3).max(2000),
});

export type OpenDisputePayload = z.infer<typeof openDisputeSchema>;

// providerWalletId/commissionPercentage are deliberately NOT accepted from
// the client here — an admin picking which wallet receives funds or what
// commission applies would be exactly the kind of client-calculated
// financial value Financial Core Phase 17 says never to trust. The route
// resolves both server-side from the dispute's underlying entity, the
// same way the non-dispute release path already does.
const resolveDisputeDecisionSchema = z.discriminatedUnion("decision", [
  z.object({
    decision: z.literal("RELEASE_TO_PROVIDER"),
    gatewayProvider: z.string().min(1).max(60),
  }),
  z.object({
    decision: z.literal("REFUND_CUSTOMER"),
    gatewayProvider: z.string().min(1).max(60),
  }),
  z.object({
    decision: z.literal("PARTIAL_SPLIT"),
    providerAmount: z.number().int().positive(),
    refundAmount: z.number().int().positive(),
    gatewayProvider: z.string().min(1).max(60),
  }),
]);

export const resolveDisputeSchema = z.object({
  resolutionNotes: z.string().min(3).max(2000),
  resolution: resolveDisputeDecisionSchema,
});

export type ResolveDisputePayload = z.infer<typeof resolveDisputeSchema>;
