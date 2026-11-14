import '../../../core/utils/result.dart';
import '../domain/company.dart';
import '../domain/company_document.dart';
import '../domain/company_invitation.dart';
import '../domain/company_member.dart';
import '../domain/company_role.dart';

abstract interface class CompanyRepository {
  Future<Result<Company>> fetchById(String id);
  Future<Result<Company>> update(String id, {String? name, String? description, String? logoUrl});

  Future<Result<List<CompanyMember>>> listMembers(String companyId);
  Future<Result<void>> inviteMember(String companyId, {required String invitedPhone, CompanyRole? role});
  Future<Result<CompanyMember>> updateMemberRole(String memberId, CompanyRole role);
  Future<Result<void>> removeMember(String memberId);
  Future<Result<List<CompanyInvitation>>> listInvitations(String companyId);
  Future<Result<void>> cancelInvitation(String invitationId);

  Future<Result<List<CompanyDocument>>> listDocuments(String companyId);
  Future<Result<CompanyDocument>> addDocument(String companyId, {required String type, required String fileUrl});
  Future<Result<void>> submitVerification(String companyId);
}
