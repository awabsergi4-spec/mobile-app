import { NextRequest } from "next/server";
import { requirePermission, UnauthenticatedError, ForbiddenError } from "@/presentation/auth-guards";
import { tokenService, staffPermissionRepository, userRepository } from "@/infrastructure/identity/auth-services";
import { ok, fail } from "@/presentation/http-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission(req, "users.manage", tokenService, staffPermissionRepository);
    const { id } = await params;

    const user = await userRepository.findById(id);
    if (!user) {
      return fail("USER_NOT_FOUND", "User not found", { status: 404 });
    }

    return ok({
      id: user.id,
      phone: user.phone,
      email: user.email,
      fullName: user.fullName,
      preferredLanguage: user.preferredLanguage,
      status: user.status,
      createdAt: user.createdAt,
    });
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
