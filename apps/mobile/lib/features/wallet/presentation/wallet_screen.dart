import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/empty_state_view.dart';
import '../../auth/application/auth_controller.dart';
import '../../auth/domain/current_user.dart';
import '../application/wallet_controller.dart';
import '../domain/wallet.dart';
import '../domain/wallet_transaction.dart';

class WalletScreen extends ConsumerWidget {
  const WalletScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final wallet = ref.watch(myWalletProvider);
    final isProvider = ref.watch(authControllerProvider).user?.workspace == UserWorkspace.provider;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.walletTitle),
        actions: [
          if (isProvider)
            IconButton(
              icon: const Icon(Icons.account_balance_outlined),
              tooltip: l10n.walletWithdrawals,
              onPressed: () => context.push('/wallet/withdrawals'),
            ),
        ],
      ),
      body: AsyncValueView<Wallet>(
        value: wallet,
        onRetry: () => ref.invalidate(myWalletProvider),
        data: (context, data) => _WalletBody(wallet: data),
      ),
    );
  }
}

class _WalletBody extends ConsumerWidget {
  const _WalletBody({required this.wallet});

  final Wallet wallet;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final transactions = ref.watch(myWalletTransactionsProvider);

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(myWalletProvider);
        ref.invalidate(myWalletTransactionsProvider);
      },
      child: ListView(
        padding: const EdgeInsets.all(AppSpacing.base),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.xl),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(l10n.walletAvailableBalance, style: Theme.of(context).textTheme.bodyMedium),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    '${wallet.availableBalance} ${wallet.currency}',
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          Text(l10n.walletTransactions, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: AppSpacing.sm),
          AsyncValueView<List<WalletTransaction>>(
            value: transactions,
            onRetry: () => ref.invalidate(myWalletTransactionsProvider),
            data: (context, data) {
              if (data.isEmpty) {
                return EmptyStateView(message: l10n.walletNoTransactions);
              }
              return Column(
                children: data
                    .map(
                      (txn) => Card(
                        child: ListTile(
                          leading: Icon(
                            txn.direction == TransactionDirection.inbound ? Icons.arrow_downward : Icons.arrow_upward,
                            color: txn.direction == TransactionDirection.inbound ? Colors.green : Colors.red,
                          ),
                          title: Text(txn.type),
                          subtitle: Text(txn.createdAt.toLocal().toString()),
                          trailing: Text('${txn.direction == TransactionDirection.inbound ? '+' : '-'}${txn.amount}'),
                        ),
                      ),
                    )
                    .toList(),
              );
            },
          ),
        ],
      ),
    );
  }
}
