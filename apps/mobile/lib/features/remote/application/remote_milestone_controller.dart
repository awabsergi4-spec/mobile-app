import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/utils/result.dart';
import '../domain/remote_milestone.dart';
import 'remote_controller.dart';

class RemoteMilestonesController extends FamilyAsyncNotifier<List<RemoteMilestone>, String> {
  @override
  Future<List<RemoteMilestone>> build(String engagementId) async {
    final result = await ref.read(remoteRepositoryProvider).listMilestones(engagementId);
    return result.when(success: (v) => v, failure: (f) => throw f);
  }

  Future<Result<RemoteMilestone>> create({required String title, required int amount}) async {
    final result = await ref.read(remoteRepositoryProvider).createMilestone(engagementId: arg, title: title, amount: amount);
    if (result.isSuccess) {
      ref.invalidateSelf();
    }
    return result;
  }
}

final remoteMilestonesControllerProvider =
    AsyncNotifierProvider.family<RemoteMilestonesController, List<RemoteMilestone>, String>(
  RemoteMilestonesController.new,
);
