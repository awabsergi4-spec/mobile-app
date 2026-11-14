import '../../../core/networking/api_client.dart';
import '../../../core/networking/app_failure_exception.dart';
import '../../../core/utils/result.dart';
import '../domain/hireable_provider.dart';
import '../domain/remote_engagement.dart';
import '../domain/remote_milestone.dart';
import 'remote_repository.dart';

class RemoteRepositoryImpl implements RemoteRepository {
  RemoteRepositoryImpl({required ApiClient apiClient}) : _apiClient = apiClient;

  final ApiClient _apiClient;

  @override
  Future<Result<List<RemoteEngagement>>> listMyEngagements({required bool asProvider}) async {
    try {
      final response = await _apiClient.get('/remote', queryParameters: {if (asProvider) 'role': 'provider'});
      return Result.success(response.dataAsList.cast<Map<String, dynamic>>().map(RemoteEngagement.fromJson).toList());
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<RemoteEngagement>> createEngagement({
    required String providerId,
    required String categoryId,
    required String title,
    required PriceType priceType,
    required int amount,
  }) async {
    try {
      final response = await _apiClient.post(
        '/remote',
        data: {
          'providerId': providerId,
          'categoryId': categoryId,
          'title': title,
          'priceType': priceType.wireValue,
          'amount': amount,
        },
      );
      return Result.success(RemoteEngagement.fromJson(response.dataAsMap));
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<RemoteEngagement>> fetchById(String id) async {
    try {
      final response = await _apiClient.get('/remote/$id');
      return Result.success(RemoteEngagement.fromJson(response.dataAsMap));
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<List<RemoteMilestone>>> listMilestones(String engagementId) async {
    try {
      final response = await _apiClient.get('/remote/$engagementId/milestones');
      return Result.success(response.dataAsList.cast<Map<String, dynamic>>().map(RemoteMilestone.fromJson).toList());
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<RemoteMilestone>> createMilestone({required String engagementId, required String title, required int amount}) async {
    try {
      final response = await _apiClient.post('/remote/$engagementId/milestones', data: {'title': title, 'amount': amount});
      return Result.success(RemoteMilestone.fromJson(response.dataAsMap));
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<List<HireableProvider>>> listHireableProviders(String categoryId) async {
    try {
      final response = await _apiClient.get('/providers', queryParameters: {'categoryId': categoryId, 'remoteAvailable': 'true'});
      return Result.success(response.dataAsList.cast<Map<String, dynamic>>().map(HireableProvider.fromJson).toList());
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }
}
