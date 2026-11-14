import { NextRequest } from "next/server";
import { createCompanyDocumentSchema } from "@sahl/shared/schemas/company.schema";
import { requireAuth, UnauthenticatedError } from "@/presentation/auth-guards";
import { tokenService } from "@/infrastructure/identity/auth-services";
import { companyMemberRepository, companyDocumentRepository } from "@/infrastructure/company/company-services";
import { requireCompanyRole, NotCompanyMemberError, CompanyRoleForbiddenError } from "@/presentation/company-guards";
import { ok, fail } from "@/presentation/http-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { id } = await params;

    await requireCompanyRole(id, userId, ["OWNER", "MANAGER"], companyMemberRepository);
    const documents = await companyDocumentRepository.listByCompanyId(id);
    return ok(documents);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof NotCompanyMemberError || err instanceof CompanyRoleForbiddenError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    throw err;
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth(req, tokenService);
    const { id } = await params;

    await requireCompanyRole(id, userId, ["OWNER", "MANAGER"], companyMemberRepository);

    const body = await req.json();
    const parsed = createCompanyDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
    }

    const document = await companyDocumentRepository.create({ companyId: id, ...parsed.data });
    return ok(document, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return fail("UNAUTHENTICATED", err.message, { status: 401 });
    }
    if (err instanceof NotCompanyMemberError || err instanceof CompanyRoleForbiddenError) {
      return fail("FORBIDDEN", err.message, { status: 403 });
    }
    throw err;
  }
}
