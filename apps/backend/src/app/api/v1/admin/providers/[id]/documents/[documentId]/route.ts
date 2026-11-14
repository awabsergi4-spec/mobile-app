import { NextRequest } from "next/server";
import { reviewProviderDocumentSchema } from "@sahl/shared/schemas/provider.schema";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { providerDocumentRepository, auditLogWriter } from "@/infrastructure/provider/provider-services";
import { ok, fail } from "@/presentation/http-response";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; documentId: string }> }) {
  try {
    const { userId } = await requirePermission(req, "providers.manage", tokenService, staffPermissionRepository);
    const { id, documentId } = await params;

    const document = await providerDocumentRepository.findById(documentId);
    if (!document || document.providerId !== id) {
      return fail("PROVIDER_DOCUMENT_NOT_FOUND", "Provider document not found", { status: 404 });
    }

    const body = await req.json();
    const parsed = reviewProviderDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    const updated = await providerDocumentRepository.updateStatus(documentId, parsed.data.status);

    await auditLogWriter.write({
      actorId: userId,
      action: "provider.document.review",
      entityType: "ProviderDocument",
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
