import '../../../core/networking/api_client.dart';
import '../../../core/networking/app_failure_exception.dart';
import '../../../core/utils/result.dart';
import '../domain/notification.dart';
import 'notification_repository.dart';

class NotificationRepositoryImpl implements NotificationRepository {
  NotificationRepositoryImpl({required ApiClient apiClient}) : _apiClient = apiClient;

  final ApiClient _apiClient;

  @override
  Future<Result<List<AppNotification>>> listMy({bool unreadOnly = false}) async {
    try {
      final response = await _apiClient.get('/notifications', queryParameters: {if (unreadOnly) 'unreadOnly': 'true'});
      return Result.success(response.dataAsList.cast<Map<String, dynamic>>().map(AppNotification.fromJson).toList());
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<int>> unreadCount() async {
    try {
      final response = await _apiClient.get('/notifications/unread-count');
      return Result.success(response.dataAsMap['count'] as int);
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<void>> markRead(String id) async {
    try {
      await _apiClient.post('/notifications/$id/read');
      return const Result.success(null);
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<int>> markAllRead() async {
    try {
      final response = await _apiClient.post('/notifications/read-all');
      return Result.success(response.dataAsMap['updatedCount'] as int);
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }
}
