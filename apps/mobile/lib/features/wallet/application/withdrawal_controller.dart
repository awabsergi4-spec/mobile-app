import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/utils/result.dart';
import '../domain/withdrawal.dart';
import 'wallet_controller.dart';

class MyWithdrawalsController extends AsyncNotifier<List<Withdrawal>> {
  @override
  Future<List<Withdrawal>> build() async {
    final result = await ref.read(walletRepositoryProvider).listMyWithdrawals();
    return result.when(success: (v) => v, failure: (f) => throw f);
  }

  Future<Result<Withdrawal>> request({required int amount, required WithdrawalMethod method}) async {
    final result = await ref.read(walletRepositoryProvider).requestWithdrawal(amount: amount, method: method);
    if (result.isSuccess) {
      ref.invalidateSelf();
      ref.invalidate(myWalletProvider);
    }
    return result;
  }
}

final myWithdrawalsControllerProvider = AsyncNotifierProvider<MyWithdrawalsController, List<Withdrawal>>(
  MyWithdrawalsController.new,
);
