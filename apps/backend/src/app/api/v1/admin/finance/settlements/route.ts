import { NextRequest } from "next/server";
import { createSettlementSchema } from "@sahl/shared/schemas/finance.schema";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { createSettlementUseCase } from "@/infrastructure/finance/finance-services";
import { auditLogWriter } from "@/infrastructure/provider/provider-services";
import { ok, fail } from "@/presentation/http-response";

// Batches every currently-APPROVED withdrawal in one currency into a
// single Settlement (ADR-008) — this is the trigger for that batch run,
// not a direct payout. Individual withdrawals still need
// mark-paid/mark-failed once the actual payout confirms.
export async function POST(req: NextRequest) {
  try {
    const { userId } = await requirePermission(req, "finance.manage", tokenService, staffPermissionRepository);

    const body = await req.json();
    const parsed = createSettlementSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    const settlement = await createSettlementUseCase.execute(parsed.data);
    if (!settlement) {
      return ok(null, { status: 200 });
    }

    await auditLogWriter.write({
      actorId: userId,
      action: "settlement.create",
      entityType: "Settlement",
      entityId: settlement.id,
      metadata: { totalAmount: settlement.totalAmount, currency: settlement.currency },
    });

    return ok(settlement, { status: 201 });
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
