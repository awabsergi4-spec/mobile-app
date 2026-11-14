import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/networking/providers.dart';
import '../../../core/utils/result.dart';
import '../data/dispute_repository.dart';
import '../data/dispute_repository_impl.dart';
import '../domain/dispute.dart';

final disputeRepositoryProvider = Provider<DisputeRepository>((ref) {
  return DisputeRepositoryImpl(apiClient: ref.watch(apiClientProvider));
});

class MyDisputesController extends AsyncNotifier<List<Dispute>> {
  @override
  Future<List<Dispute>> build() async {
    final result = await ref.read(disputeRepositoryProvider).listMyDisputes();
    return result.when(success: (v) => v, failure: (f) => throw f);
  }

  Future<Result<Dispute>> open({required String relatedEntityType, required String relatedEntityId, required String reason}) async {
    final result = await ref
        .read(disputeRepositoryProvider)
        .openDispute(relatedEntityType: relatedEntityType, relatedEntityId: relatedEntityId, reason: reason);
    if (result.isSuccess) {
      ref.invalidateSelf();
    }
    return result;
  }
}

final myDisputesControllerProvider = AsyncNotifierProvider<MyDisputesController, List<Dispute>>(MyDisputesController.new);
