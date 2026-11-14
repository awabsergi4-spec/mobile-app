import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/networking/providers.dart';
import '../../../core/utils/result.dart';
import '../data/on_demand_repository.dart';
import '../data/on_demand_repository_impl.dart';
import '../domain/on_demand_request.dart';

final onDemandRepositoryProvider = Provider<OnDemandRepository>((ref) {
  return OnDemandRepositoryImpl(apiClient: ref.watch(apiClientProvider));
});

class MyOnDemandRequestsController extends AsyncNotifier<List<OnDemandRequest>> {
  @override
  Future<List<OnDemandRequest>> build() async {
    final result = await ref.read(onDemandRepositoryProvider).listMyRequests();
    return result.when(success: (requests) => requests, failure: (failure) => throw failure);
  }

  Future<Result<OnDemandRequest>> create({
    required String categoryId,
    required String description,
    required double lat,
    required double lng,
    bool isEmergency = false,
  }) async {
    final result = await ref.read(onDemandRepositoryProvider).createRequest(
          categoryId: categoryId,
          description: description,
          lat: lat,
          lng: lng,
          isEmergency: isEmergency,
        );
    if (result.isSuccess) {
      ref.invalidateSelf();
    }
    return result;
  }

  Future<Result<void>> cancel(String id) async {
    final result = await ref.read(onDemandRepositoryProvider).cancel(id);
    if (result.isSuccess) {
      ref.invalidateSelf();
    }
    return result;
  }
}

final myOnDemandRequestsControllerProvider = AsyncNotifierProvider<MyOnDemandRequestsController, List<OnDemandRequest>>(
  MyOnDemandRequestsController.new,
);

final onDemandRequestDetailProvider = FutureProvider.family<OnDemandRequest, String>((ref, id) async {
  final result = await ref.watch(onDemandRepositoryProvider).fetchById(id);
  return result.when(success: (r) => r, failure: (failure) => throw failure);
});
