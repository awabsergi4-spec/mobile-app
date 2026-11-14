import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/networking/providers.dart';
import '../../../core/utils/result.dart';
import '../data/remote_repository.dart';
import '../data/remote_repository_impl.dart';
import '../domain/hireable_provider.dart';
import '../domain/remote_engagement.dart';

final remoteRepositoryProvider = Provider<RemoteRepository>((ref) {
  return RemoteRepositoryImpl(apiClient: ref.watch(apiClientProvider));
});

class MyRemoteEngagementsController extends FamilyAsyncNotifier<List<RemoteEngagement>, bool> {
  @override
  Future<List<RemoteEngagement>> build(bool asProvider) async {
    final result = await ref.read(remoteRepositoryProvider).listMyEngagements(asProvider: asProvider);
    return result.when(success: (v) => v, failure: (f) => throw f);
  }

  Future<Result<RemoteEngagement>> create({
    required String providerId,
    required String categoryId,
    required String title,
    required PriceType priceType,
    required int amount,
  }) async {
    final result = await ref
        .read(remoteRepositoryProvider)
        .createEngagement(providerId: providerId, categoryId: categoryId, title: title, priceType: priceType, amount: amount);
    if (result.isSuccess) {
      ref.invalidateSelf();
    }
    return result;
  }
}

final myRemoteEngagementsControllerProvider =
    AsyncNotifierProvider.family<MyRemoteEngagementsController, List<RemoteEngagement>, bool>(
  MyRemoteEngagementsController.new,
);

final remoteEngagementDetailProvider = FutureProvider.family<RemoteEngagement, String>((ref, id) async {
  final result = await ref.watch(remoteRepositoryProvider).fetchById(id);
  return result.when(success: (v) => v, failure: (f) => throw f);
});

final hireableProvidersProvider = FutureProvider.family<List<HireableProvider>, String>((ref, categoryId) async {
  final result = await ref.watch(remoteRepositoryProvider).listHireableProviders(categoryId);
  return result.when(success: (v) => v, failure: (f) => throw f);
});
