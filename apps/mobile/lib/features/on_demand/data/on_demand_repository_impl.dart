import '../../../core/networking/api_call.dart';
import '../../../core/networking/api_client.dart';
import '../../../core/networking/app_failure_exception.dart';
import '../../../core/utils/result.dart';
import '../domain/on_demand_assignment.dart';
import '../domain/on_demand_request.dart';
import 'on_demand_repository.dart';

class OnDemandRepositoryImpl implements OnDemandRepository {
  OnDemandRepositoryImpl({required ApiClient apiClient}) : _apiClient = apiClient;

  final ApiClient _apiClient;

  @override
  Future<Result<List<OnDemandRequest>>> listMyRequests() async {
    try {
      final response = await _apiClient.get('/on-demand');
      final requests = response.dataAsList.cast<Map<String, dynamic>>().map(OnDemandRequest.fromJson).toList();
      return Result.success(requests);
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<OnDemandRequest>> createRequest({
    required String categoryId,
    required String description,
    required double lat,
    required double lng,
    bool isEmergency = false,
    DateTime? scheduledFor,
  }) async {
    try {
      final response = await _apiClient.post(
        '/on-demand',
        data: {
          'categoryId': categoryId,
          'description': description,
          'lat': lat,
          'lng': lng,
          'isEmergency': isEmergency,
          if (scheduledFor != null) 'fulfillmentMode': 'SCHEDULED',
          if (scheduledFor != null) 'scheduledFor': scheduledFor.toUtc().toIso8601String(),
        },
      );
      return Result.success(OnDemandRequest.fromJson(response.dataAsMap));
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<OnDemandRequest>> fetchById(String id) async {
    try {
      final response = await _apiClient.get('/on-demand/$id');
      return Result.success(OnDemandRequest.fromJson(response.dataAsMap));
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<void>> cancel(String id) async {
    try {
      await _apiClient.post('/on-demand/$id/cancel');
      return const Result.success(null);
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<List<OnDemandAssignment>>> listMyAssignments() async {
    try {
      final response = await _apiClient.get('/on-demand/assignments/me');
      final assignments = response.dataAsList.cast<Map<String, dynamic>>().map(OnDemandAssignment.fromJson).toList();
      return Result.success(assignments);
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<void>> acceptAssignment(String assignmentId) async {
    try {
      await _apiClient.post('/on-demand/assignments/$assignmentId/accept');
      return const Result.success(null);
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<void>> declineAssignment(String assignmentId) async {
    try {
      await _apiClient.post('/on-demand/assignments/$assignmentId/decline');
      return const Result.success(null);
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<List<OnDemandAssignment>>> listRequestAssignments(String requestId) => apiCall(() async {
        final response = await _apiClient.get('/on-demand/$requestId/assignments');
        return response.dataAsList.cast<Map<String, dynamic>>().map(OnDemandAssignment.fromJson).toList();
      });
}
