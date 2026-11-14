import '../../../core/utils/result.dart';
import '../domain/dispute.dart';

abstract interface class DisputeRepository {
  Future<Result<List<Dispute>>> listMyDisputes();
  Future<Result<Dispute>> openDispute({
    required String relatedEntityType,
    required String relatedEntityId,
    required String reason,
  });
}
