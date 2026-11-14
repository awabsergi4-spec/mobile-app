import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/utils/result.dart';
import '../../wallet/domain/withdrawal.dart';
import '../domain/provider_payout_account.dart';
import 'provider_controller.dart';

class ProviderPayoutAccountsController extends AsyncNotifier<List<ProviderPayoutAccount>> {
  @override
  Future<List<ProviderPayoutAccount>> build() async {
    final result = await ref.read(providerRepositoryProvider).listPayoutAccounts();
    return result.when(success: (v) => v, failure: (f) => throw f);
  }

  Future<Result<ProviderPayoutAccount>> addAccount({
    required WithdrawalMethod method,
    required Map<String, dynamic> accountDetails,
    bool? isDefault,
  }) async {
    final result = await ref
        .read(providerRepositoryProvider)
        .addPayoutAccount(method: method, accountDetails: accountDetails, isDefault: isDefault);
    if (result.isSuccess) {
      ref.invalidateSelf();
    }
    return result;
  }

  Future<Result<void>> deleteAccount(String id) async {
    final result = await ref.read(providerRepositoryProvider).deletePayoutAccount(id);
    if (result.isSuccess) {
      ref.invalidateSelf();
    }
    return result;
  }

  Future<Result<void>> setDefault(String id) async {
    final result = await ref.read(providerRepositoryProvider).setDefaultPayoutAccount(id);
    if (result.isSuccess) {
      ref.invalidateSelf();
    }
    return result;
  }
}

final providerPayoutAccountsControllerProvider =
    AsyncNotifierProvider<ProviderPayoutAccountsController, List<ProviderPayoutAccount>>(
  ProviderPayoutAccountsController.new,
);
