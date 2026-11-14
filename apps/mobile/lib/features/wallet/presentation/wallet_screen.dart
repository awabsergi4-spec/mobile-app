import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/utils/formatters.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/empty_state_view.dart';
import '../../../shared/widgets/sahl_ui.dart';
import '../../auth/application/auth_controller.dart';
import '../../auth/domain/current_user.dart';
import '../application/wallet_controller.dart';
import '../domain/wallet.dart';
import '../domain/wallet_transaction.dart';

/// Wallet (customer tab) / Earnings (provider tab): balances by bucket and
/// the transaction history.
class WalletScreen extends ConsumerWidget {
  const WalletScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final wallet = ref.watch(myWalletProvider);
    final isProvider = ref.watch(authControllerProvider).user?.workspace == UserWorkspace.provider;

    return Scaffold(
      appBar: AppBar(
        title: Text(isProvider ? l10n.navEarnings : l10n.walletTitle),
        actions: [
          if (isProvider)
            IconButton(
              icon: const Icon(Symbols.account_balance),
              tooltip: l10n.walletWithdrawals,
              onPressed: () => context.push('/wallet/withdrawals'),
            ),
        ],
      ),
      body: AsyncValueView<Wallet>(
        value: wallet,
        loading: const SkeletonList(itemCount: 4),
        onRetry: () => ref.invalidate(myWalletProvider),
        data: (context, data) => _WalletBody(wallet: data),
      ),
    );
  }
}

String transactionTypeText(AppLocalizations l10n, String type) => switch (type) {
      'DEPOSIT' => l10n.txTypeDeposit,
      'WITHDRAWAL' => l10n.txTypeWithdrawal,
      'TRANSFER' => l10n.txTypeTransfer,
      'ESCROW_HOLD' => l10n.txTypeEscrowHold,
      'ESCROW_RELEASE' => l10n.txTypeEscrowRelease,
      'REFUND' => l10n.txTypeRefund,
      'COMMISSION' => l10n.txTypeCommission,
      'BONUS' => l10n.txTypeBonus,
      'CASHBACK' => l10n.txTypeCashback,
      'REWARD' => l10n.txTypeReward,
      'ADJUSTMENT' => l10n.txTypeAdjustment,
      'PENALTY' => l10n.txTypePenalty,
      'PROMOTION' => l10n.txTypePromotion,
      'TAX' => l10n.txTypeTax,
      'PROCESSING_FEE' => l10n.txTypeProcessingFee,
      _ => type,
    };

(String, StatusTone) _statusText(AppLocalizations l10n, String status) => switch (status) {
      'PENDING' => (l10n.txStatusPending, StatusTone.warning),
      'HELD' => (l10n.txStatusHeld, StatusTone.info),
      'FAILED' => (l10n.txStatusFailed, StatusTone.danger),
      'REVERSED' => (l10n.txStatusReversed, StatusTone.neutral),
      _ => (l10n.txStatusSucceeded, StatusTone.success),
    };

class _WalletBody extends ConsumerWidget {
  const _WalletBody({required this.wallet});

  final Wallet wallet;

  int _bucket(WalletBucket b) => wallet.balances.where((x) => x.bucket == b).fold(0, (sum, x) => sum + x.amount);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final tokens = context.sahl;
    final transactions = ref.watch(myWalletTransactionsProvider);

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(myWalletProvider);
        ref.invalidate(myWalletTransactionsProvider);
      },
      child: ListView(
        padding: const EdgeInsets.all(AppSpacing.base),
        children: [
          GradientCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Symbols.account_balance_wallet),
                    const SizedBox(width: AppSpacing.sm),
                    Text(l10n.walletAvailableBalance),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                Text(
                  '${Fmt.number(context, wallet.availableBalance)} ${wallet.currency}',
                  style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w900),
                ),
              ],
            ),
          ),
          if (wallet.isFrozen) ...[
            const SizedBox(height: AppSpacing.md),
            SahlCard(
              child: Row(
                children: [
                  Icon(Symbols.ac_unit, color: tokens.warning),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(child: Text(l10n.walletFrozen)),
                ],
              ),
            ),
          ],
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: StatTile(
                  icon: Symbols.hourglass_top,
                  color: tokens.warning,
                  value: Fmt.number(context, _bucket(WalletBucket.pending)),
                  label: l10n.walletPending,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: StatTile(
                  icon: Symbols.lock,
                  color: tokens.info,
                  value: Fmt.number(context, _bucket(WalletBucket.locked)),
                  label: l10n.walletLocked,
                ),
              ),
            ],
          ),
          SectionHeader(title: l10n.walletTransactions),
          AsyncValueView<List<WalletTransaction>>(
            value: transactions,
            loading: const SizedBox(height: 200, child: SkeletonList(itemCount: 3)),
            onRetry: () => ref.invalidate(myWalletTransactionsProvider),
            data: (context, data) {
              if (data.isEmpty) {
                return EmptyStateView(icon: Symbols.receipt_long, message: l10n.walletNoTransactions);
              }
              return Column(
                children: [
                  for (final txn in data) ...[
                    _TransactionTile(txn: txn),
                    const SizedBox(height: AppSpacing.sm),
                  ],
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

class _TransactionTile extends StatelessWidget {
  const _TransactionTile({required this.txn});

  final WalletTransaction txn;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final tokens = context.sahl;
    final inbound = txn.direction == TransactionDirection.inbound;
    final color = inbound ? tokens.success : Theme.of(context).colorScheme.error;
    final (statusLabel, tone) = _statusText(l10n, txn.status);
    return SahlCard(
      child: Row(
        children: [
          IconBadge(icon: inbound ? Symbols.south_west : Symbols.north_east, color: color),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(transactionTypeText(l10n, txn.type), style: const TextStyle(fontWeight: FontWeight.w700)),
                const SizedBox(height: 2),
                Text(Fmt.dateTime(context, txn.createdAt), style: TextStyle(color: tokens.textMuted, fontSize: 12)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${inbound ? '+' : '−'}${Fmt.number(context, txn.amount)}',
                style: TextStyle(color: color, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 4),
              StatusChip(label: statusLabel, tone: tone),
            ],
          ),
        ],
      ),
    );
  }
}
