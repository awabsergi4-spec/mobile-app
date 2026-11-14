import '../../../core/utils/result.dart';
import '../domain/on_demand_assignment.dart';
import '../domain/on_demand_request.dart';

abstract interface class OnDemandRepository {
  Future<Result<List<OnDemandRequest>>> listMyRequests();
  Future<Result<OnDemandRequest>> createRequest({
    required String categoryId,
    required String description,
    required double lat,
    required double lng,
    bool isEmergency,

    /// When set, the request is SCHEDULED for this time instead of INSTANT.
    DateTime? scheduledFor,
  });
  Future<Result<OnDemandRequest>> fetchById(String id);
  Future<Result<void>> cancel(String id);

  /// Offers made for one request, with the provider's name/rating.
  Future<Result<List<OnDemandAssignment>>> listRequestAssignments(String requestId);

  Future<Result<List<OnDemandAssignment>>> listMyAssignments();
  Future<Result<void>> acceptAssignment(String assignmentId);
  Future<Result<void>> declineAssignment(String assignmentId);
}
