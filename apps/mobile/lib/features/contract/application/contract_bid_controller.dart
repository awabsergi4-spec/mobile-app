import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/utils/result.dart';
import '../domain/contract_bid.dart';
import 'contract_controller.dart';

final projectBidsProvider = FutureProvider.family<List<ContractBid>, String>((ref, projectId) async {
  final result = await ref.watch(contractRepositoryProvider).listBidsForProject(projectId);
  return result.when(success: (v) => v, failure: (f) => throw f);
});

class MyContractBidsController extends AsyncNotifier<List<ContractBid>> {
  @override
  Future<List<ContractBid>> build() async {
    final result = await ref.read(contractRepositoryProvider).listMyBids();
    return result.when(success: (v) => v, failure: (f) => throw f);
  }

  Future<Result<ContractBid>> submit({required String projectId, required int amount, String? message}) async {
    final result = await ref.read(contractRepositoryProvider).submitBid(projectId: projectId, amount: amount, message: message);
    if (result.isSuccess) {
      ref.invalidateSelf();
    }
    return result;
  }

  Future<Result<void>> withdraw(String bidId) async {
    final result = await ref.read(contractRepositoryProvider).withdrawBid(bidId);
    if (result.isSuccess) {
      ref.invalidateSelf();
    }
    return result;
  }
}

final myContractBidsControllerProvider = AsyncNotifierProvider<MyContractBidsController, List<ContractBid>>(
  MyContractBidsController.new,
);
