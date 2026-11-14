import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/networking/providers.dart';
import '../data/wallet_repository.dart';
import '../data/wallet_repository_impl.dart';
import '../domain/wallet_transaction.dart';

final walletRepositoryProvider = Provider<WalletRepository>((ref) {
  return WalletRepositoryImpl(apiClient: ref.watch(apiClientProvider));
});

final myWalletProvider = FutureProvider((ref) async {
  final result = await ref.watch(walletRepositoryProvider).fetchMyWallet();
  return result.when(success: (v) => v, failure: (f) => throw f);
});

final myWalletTransactionsProvider = FutureProvider<List<WalletTransaction>>((ref) async {
  final result = await ref.watch(walletRepositoryProvider).listMyTransactions();
  return result.when(success: (v) => v, failure: (f) => throw f);
});
