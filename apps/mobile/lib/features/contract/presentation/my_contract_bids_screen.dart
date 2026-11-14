import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/empty_state_view.dart';
import '../application/contract_bid_controller.dart';
import '../domain/contract_bid.dart';
import 'widgets/contract_status_label.dart';

class MyContractBidsScreen extends ConsumerWidget {
  const MyContractBidsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final bids = ref.watch(myContractBidsControllerProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.contractMyBids)),
      body: AsyncValueView<List<ContractBid>>(
        value: bids,
        onRetry: () => ref.invalidate(myContractBidsControllerProvider),
        data: (context, data) {
          if (data.isEmpty) {
            return EmptyStateView(message: l10n.contractNoBids);
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(myContractBidsControllerProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(AppSpacing.base),
              itemCount: data.length,
              separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
              itemBuilder: (context, index) {
                final bid = data[index];
                return Card(
                  child: ListTile(
                    title: Text(bid.amount.toString()),
                    subtitle: bid.message != null ? Text(bid.message!) : null,
                    trailing: bid.status == ContractBidStatus.submitted
                        ? TextButton(
                            onPressed: () => ref.read(myContractBidsControllerProvider.notifier).withdraw(bid.id),
                            child: Text(l10n.contractWithdrawBid),
                          )
                        : Chip(
                            label: Text(contractBidStatusText(l10n, bid.status)),
                            backgroundColor: contractBidStatusColor(context, bid.status).withValues(alpha: 0.15),
                            labelStyle: TextStyle(color: contractBidStatusColor(context, bid.status)),
                            side: BorderSide.none,
                          ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
