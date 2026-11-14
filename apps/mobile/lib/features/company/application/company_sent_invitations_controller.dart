import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/utils/result.dart';
import '../domain/company_invitation.dart';
import 'company_controller.dart';

/// Family-keyed by companyId — invitations the company has sent (any
/// status), for OWNER/MANAGER to review and cancel pending ones. Distinct
/// from MyCompanyInvitationsController, which is the invitee-side list.
class CompanySentInvitationsController extends FamilyAsyncNotifier<List<CompanyInvitation>, String> {
  @override
  Future<List<CompanyInvitation>> build(String companyId) async {
    final result = await ref.read(companyRepositoryProvider).listInvitations(companyId);
    return result.when(success: (v) => v, failure: (f) => throw f);
  }

  Future<Result<void>> cancel(String invitationId) async {
    final result = await ref.read(companyRepositoryProvider).cancelInvitation(invitationId);
    if (result.isSuccess) {
      ref.invalidateSelf();
    }
    return result;
  }
}

final companySentInvitationsControllerProvider =
    AsyncNotifierProvider.family<CompanySentInvitationsController, List<CompanyInvitation>, String>(
  CompanySentInvitationsController.new,
);
