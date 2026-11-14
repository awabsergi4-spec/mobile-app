import '../../../core/networking/api_client.dart';
import '../../../core/networking/app_failure_exception.dart';
import '../../../core/utils/result.dart';
import '../domain/dispute.dart';
import 'dispute_repository.dart';

class DisputeRepositoryImpl implements DisputeRepository {
  DisputeRepositoryImpl({required ApiClient apiClient}) : _apiClient = apiClient;

  final ApiClient _apiClient;

  @override
  Future<Result<List<Dispute>>> listMyDisputes() async {
    try {
      final response = await _apiClient.get('/disputes');
      return Result.success(response.dataAsList.cast<Map<String, dynamic>>().map(Dispute.fromJson).toList());
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<Dispute>> openDispute({
    required String relatedEntityType,
    required String relatedEntityId,
    required String reason,
  }) async {
    try {
      final response = await _apiClient.post(
        '/disputes',
        data: {'relatedEntityType': relatedEntityType, 'relatedEntityId': relatedEntityId, 'reason': reason},
      );
      return Result.success(Dispute.fromJson(response.dataAsMap));
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }
}
