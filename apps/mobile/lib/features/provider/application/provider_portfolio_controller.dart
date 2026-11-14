import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/utils/result.dart';
import '../domain/provider_portfolio_item.dart';
import 'provider_controller.dart';

class ProviderPortfolioController extends AsyncNotifier<List<ProviderPortfolioItem>> {
  @override
  Future<List<ProviderPortfolioItem>> build() async {
    final result = await ref.read(providerRepositoryProvider).listPortfolio();
    return result.when(success: (v) => v, failure: (f) => throw f);
  }

  Future<Result<ProviderPortfolioItem>> addItem({required String mediaUrl, String? title, String? description}) async {
    final result = await ref.read(providerRepositoryProvider).addPortfolioItem(mediaUrl: mediaUrl, title: title, description: description);
    if (result.isSuccess) {
      ref.invalidateSelf();
    }
    return result;
  }

  Future<Result<void>> deleteItem(String id) async {
    final result = await ref.read(providerRepositoryProvider).deletePortfolioItem(id);
    if (result.isSuccess) {
      ref.invalidateSelf();
    }
    return result;
  }
}

final providerPortfolioControllerProvider = AsyncNotifierProvider<ProviderPortfolioController, List<ProviderPortfolioItem>>(
  ProviderPortfolioController.new,
);
