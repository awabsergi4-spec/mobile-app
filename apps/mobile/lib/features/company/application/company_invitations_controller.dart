import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/networking/providers.dart';
import '../../../core/utils/result.dart';
import '../../auth/application/auth_controller.dart';
import '../data/company_invitation_repository.dart';
import '../data/company_invitation_repository_impl.dart';
import '../domain/company_invitation.dart';
import '../domain/company_member.dart';

final companyInvitationRepositoryProvider = Provider<CompanyInvitationRepository>((ref) {
  return CompanyInvitationRepositoryImpl(apiClient: ref.watch(apiClientProvider));
});

/// Invitee-side: invitations addressed to the current user's own phone
/// number, across any company — not scoped to a companyId.
class MyCompanyInvitationsController extends AsyncNotifier<List<CompanyInvitation>> {
  @override
  Future<List<CompanyInvitation>> build() async {
    final result = await ref.read(companyInvitationRepositoryProvider).listMine();
    return result.when(success: (v) => v, failure: (f) => throw f);
  }

  Future<Result<CompanyMember>> accept(String invitationId) async {
    final result = await ref.read(companyInvitationRepositoryProvider).accept(invitationId);
    if (result.isSuccess) {
      ref.invalidateSelf();
      // Accepting changes companyMembership on the user's own record, which
      // decides which Home shell/workspace they see next.
      await ref.read(authControllerProvider.notifier).refreshCurrentUser();
    }
    return result;
  }
}

final myCompanyInvitationsControllerProvider =
    AsyncNotifierProvider<MyCompanyInvitationsController, List<CompanyInvitation>>(
  MyCompanyInvitationsController.new,
);
