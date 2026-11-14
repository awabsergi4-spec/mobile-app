import '../../../core/utils/result.dart';
import '../domain/company_invitation.dart';
import '../domain/company_member.dart';

/// Invitee-side operations — invitations addressed to the current user's
/// own phone number, resolved server-side (see companies/invitations/mine
/// route). Distinct from CompanyRepository, which covers the company-admin
/// side (inviting others, cancelling invitations the company sent).
abstract interface class CompanyInvitationRepository {
  Future<Result<List<CompanyInvitation>>> listMine();
  Future<Result<CompanyMember>> accept(String invitationId);
}
