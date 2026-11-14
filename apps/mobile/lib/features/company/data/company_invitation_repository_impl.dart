import '../../../core/networking/api_client.dart';
import '../../../core/networking/app_failure_exception.dart';
import '../../../core/utils/result.dart';
import '../domain/company_invitation.dart';
import '../domain/company_member.dart';
import 'company_invitation_repository.dart';

class CompanyInvitationRepositoryImpl implements CompanyInvitationRepository {
  CompanyInvitationRepositoryImpl({required ApiClient apiClient}) : _apiClient = apiClient;

  final ApiClient _apiClient;

  @override
  Future<Result<List<CompanyInvitation>>> listMine() async {
    try {
      final response = await _apiClient.get('/companies/invitations/mine');
      return Result.success(response.dataAsList.cast<Map<String, dynamic>>().map(CompanyInvitation.fromJson).toList());
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<CompanyMember>> accept(String invitationId) async {
    try {
      final response = await _apiClient.post('/companies/invitations/$invitationId/accept');
      return Result.success(CompanyMember.fromJson(response.dataAsMap));
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }
}
