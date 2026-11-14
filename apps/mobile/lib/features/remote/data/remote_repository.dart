import '../../../core/utils/result.dart';
import '../domain/hireable_provider.dart';
import '../domain/remote_engagement.dart';
import '../domain/remote_milestone.dart';

abstract interface class RemoteRepository {
  Future<Result<List<RemoteEngagement>>> listMyEngagements({required bool asProvider});
  Future<Result<RemoteEngagement>> createEngagement({
    required String providerId,
    required String categoryId,
    required String title,
    required PriceType priceType,
    required int amount,
  });
  Future<Result<RemoteEngagement>> fetchById(String id);

  Future<Result<List<RemoteMilestone>>> listMilestones(String engagementId);
  Future<Result<RemoteMilestone>> createMilestone({required String engagementId, required String title, required int amount});

  Future<Result<List<HireableProvider>>> listHireableProviders(String categoryId);
}
