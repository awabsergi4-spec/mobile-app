import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/utils/result.dart';
import '../domain/contract_milestone.dart';
import 'contract_controller.dart';

final contractDetailProvider = FutureProvider.family((ref, String contractId) async {
  final result = await ref.watch(contractRepositoryProvider).fetchContractById(contractId);
  return result.when(success: (v) => v, failure: (f) => throw f);
});

class ContractMilestonesController extends FamilyAsyncNotifier<List<ContractMilestone>, String> {
  @override
  Future<List<ContractMilestone>> build(String contractId) async {
    final result = await ref.read(contractRepositoryProvider).listMilestones(contractId);
    return result.when(success: (v) => v, failure: (f) => throw f);
  }

  Future<Result<ContractMilestone>> create({required String title, required int amount}) async {
    final result = await ref.read(contractRepositoryProvider).createMilestone(contractId: arg, title: title, amount: amount);
    if (result.isSuccess) {
      ref.invalidateSelf();
    }
    return result;
  }
}

final contractMilestonesControllerProvider =
    AsyncNotifierProvider.family<ContractMilestonesController, List<ContractMilestone>, String>(
  ContractMilestonesController.new,
);
