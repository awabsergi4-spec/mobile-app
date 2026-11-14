import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/utils/result.dart';
import '../domain/company_member.dart';
import '../domain/company_role.dart';
import 'company_controller.dart';

/// Family-keyed by companyId. Covers the company-admin side of membership:
/// listing current members and inviting/removing/re-roling them. Backend
/// enforces OWNER/MANAGER-only for the mutating calls (see
/// apps/backend/src/presentation/company-guards.ts) regardless of what this
/// screen shows, so UI-side role gating here is presentation only.
class CompanyMembersController extends FamilyAsyncNotifier<List<CompanyMember>, String> {
  @override
  Future<List<CompanyMember>> build(String companyId) async {
    final result = await ref.read(companyRepositoryProvider).listMembers(companyId);
    return result.when(success: (v) => v, failure: (f) => throw f);
  }

  Future<Result<void>> invite({required String invitedPhone, CompanyRole? role}) async {
    final result = await ref.read(companyRepositoryProvider).inviteMember(arg, invitedPhone: invitedPhone, role: role);
    return result;
  }

  Future<Result<CompanyMember>> updateRole(String memberId, CompanyRole role) async {
    final result = await ref.read(companyRepositoryProvider).updateMemberRole(memberId, role);
    if (result.isSuccess) {
      ref.invalidateSelf();
    }
    return result;
  }

  Future<Result<void>> remove(String memberId) async {
    final result = await ref.read(companyRepositoryProvider).removeMember(memberId);
    if (result.isSuccess) {
      ref.invalidateSelf();
    }
    return result;
  }
}

final companyMembersControllerProvider = AsyncNotifierProvider.family<CompanyMembersController, List<CompanyMember>, String>(
  CompanyMembersController.new,
);
