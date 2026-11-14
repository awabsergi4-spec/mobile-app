import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { refundPaymentSchema } from "@sahl/shared/schemas/finance.schema";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { refundPaymentUseCase } from "@/infrastructure/finance/finance-services";
import { auditLogWriter } from "@/infrastructure/provider/provider-services";
import {
  EscrowDisputedError,
  EscrowNotFoundError,
  EscrowNotHeldError,
  EscrowReleaseConflictError,
  InvalidRefundAmountError,
} from "@/application/finance/errors";
import { ok, fail } from "@/presentation/http-response";

// Admin-triggered entry point into RefundPaymentUseCase (built in Financial
// Core Phase 6, previously unreachable via any route). A true self-service
// customer-initiated refund/cancellation flow would need its own
// per-entity-type eligibility rules (when is a customer allowed to cancel
// and get money back?) that don't exist yet anywhere in Contract/Remote/
// On-Demand — flagged as a real gap rather than built ad hoc here. This
// route only covers the still-in-escrow case; funds already released to a
// provider's wallet are explicitly out of scope (see RefundPaymentUseCase).
export async function POST(req: NextRequest) {
  try {
    const { userId } = await requirePermission(req, "finance.manage", tokenService, staffPermissionRepository);

    const body = await req.json();
    const parsed = refundPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    const result = await refundPaymentUseCase.execute({
      relatedEntityType: parsed.data.relatedEntityType,
      relatedEntityId: parsed.data.relatedEntityId,
      regionId: parsed.data.regionId,
      refundAmount: parsed.data.refundAmount,
      reason: parsed.data.reason,
      idempotencyKey: `admin-refund:${parsed.data.relatedEntityType}:${parsed.data.relatedEntityId}:${randomUUID()}`,
    });

    await auditLogWriter.write({
      actorId: userId,
      action: "payment.refund",
      entityType: parsed.data.relatedEntityType,
      entityId: parsed.data.relatedEntityId,
      metadata: { refundAmount: result.refundAmount, reason: parsed.data.reason },
    });

    return ok(result, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    if (err instanceof EscrowNotFoundError) {
      return fail("ESCROW_NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof InvalidRefundAmountError) {
      return fail("INVALID_REFUND_AMOUNT", err.message, { status: 400 });
    }
    if (err instanceof EscrowNotHeldError || err instanceof EscrowDisputedError || err instanceof EscrowReleaseConflictError) {
      return fail("ESCROW_NOT_REFUNDABLE", err.message, { status: 409 });
    }
    throw err;
  }
}
