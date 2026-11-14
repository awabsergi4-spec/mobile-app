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
  });
  Future<Result<OnDemandRequest>> fetchById(String id);
  Future<Result<void>> cancel(String id);

  Future<Result<List<OnDemandAssignment>>> listMyAssignments();
  Future<Result<void>> acceptAssignment(String assignmentId);
  Future<Result<void>> declineAssignment(String assignmentId);
}
