import '../../../core/networking/api_client.dart';
import '../../../core/networking/app_failure_exception.dart';
import '../../../core/utils/result.dart';
import '../domain/company.dart';
import '../domain/company_document.dart';
import '../domain/company_invitation.dart';
import '../domain/company_member.dart';
import '../domain/company_role.dart';
import 'company_repository.dart';

class CompanyRepositoryImpl implements CompanyRepository {
  CompanyRepositoryImpl({required ApiClient apiClient}) : _apiClient = apiClient;

  final ApiClient _apiClient;

  @override
  Future<Result<Company>> fetchById(String id) async {
    try {
      final response = await _apiClient.get('/companies/$id');
      return Result.success(Company.fromJson(response.dataAsMap));
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<Company>> update(String id, {String? name, String? description, String? logoUrl}) async {
    try {
      final response = await _apiClient.patch('/companies/$id', data: {
        if (name != null) 'name': name,
        if (description != null) 'description': description,
        if (logoUrl != null) 'logoUrl': logoUrl,
      });
      return Result.success(Company.fromJson(response.dataAsMap));
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<List<CompanyMember>>> listMembers(String companyId) async {
    try {
      final response = await _apiClient.get('/companies/$companyId/members');
      return Result.success(response.dataAsList.cast<Map<String, dynamic>>().map(CompanyMember.fromJson).toList());
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<void>> inviteMember(String companyId, {required String invitedPhone, CompanyRole? role}) async {
    try {
      await _apiClient.post('/companies/$companyId/members', data: {
        'invitedPhone': invitedPhone,
        if (role != null) 'role': role.wireValue,
      });
      return const Result.success(null);
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<CompanyMember>> updateMemberRole(String memberId, CompanyRole role) async {
    try {
      final response = await _apiClient.patch('/companies/members/$memberId', data: {'role': role.wireValue});
      return Result.success(CompanyMember.fromJson(response.dataAsMap));
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<void>> removeMember(String memberId) async {
    try {
      await _apiClient.delete('/companies/members/$memberId');
      return const Result.success(null);
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<List<CompanyInvitation>>> listInvitations(String companyId) async {
    try {
      final response = await _apiClient.get('/companies/$companyId/invitations');
      return Result.success(response.dataAsList.cast<Map<String, dynamic>>().map(CompanyInvitation.fromJson).toList());
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<void>> cancelInvitation(String invitationId) async {
    try {
      await _apiClient.post('/companies/invitations/$invitationId/cancel');
      return const Result.success(null);
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<List<CompanyDocument>>> listDocuments(String companyId) async {
    try {
      final response = await _apiClient.get('/companies/$companyId/documents');
      return Result.success(response.dataAsList.cast<Map<String, dynamic>>().map(CompanyDocument.fromJson).toList());
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<CompanyDocument>> addDocument(String companyId, {required String type, required String fileUrl}) async {
    try {
      final response = await _apiClient.post('/companies/$companyId/documents', data: {'type': type, 'fileUrl': fileUrl});
      return Result.success(CompanyDocument.fromJson(response.dataAsMap));
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<void>> submitVerification(String companyId) async {
    try {
      await _apiClient.post('/companies/$companyId/verification/submit');
      return const Result.success(null);
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }
}
