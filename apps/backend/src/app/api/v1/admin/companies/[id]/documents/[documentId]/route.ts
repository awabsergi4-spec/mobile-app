import { NextRequest } from "next/server";
import { reviewCompanyDocumentSchema } from "@sahl/shared/schemas/company.schema";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { companyDocumentRepository } from "@/infrastructure/company/company-services";
import { auditLogWriter } from "@/infrastructure/provider/provider-services";
import { ok, fail } from "@/presentation/http-response";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; documentId: string }> }) {
  try {
    const { userId } = await requirePermission(req, "companies.manage", tokenService, staffPermissionRepository);
    const { id, documentId } = await params;

    const document = await companyDocumentRepository.findById(documentId);
    if (!document || document.companyId !== id) {
      return fail("COMPANY_DOCUMENT_NOT_FOUND", "Company document not found", { status: 404 });
    }

    const body = await req.json();
    const parsed = reviewCompanyDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    const updated = await companyDocumentRepository.updateStatus(documentId, parsed.data.status);

    await auditLogWriter.write({
      actorId: userId,
      action: "company.document.review",
      entityType: "CompanyDocument",
      entityId: documentId,
      metadata: { status: parsed.data.status },
    });

    return ok(updated);
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
