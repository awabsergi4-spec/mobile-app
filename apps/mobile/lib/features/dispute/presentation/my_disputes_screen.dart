import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/empty_state_view.dart';
import '../application/dispute_controller.dart';
import '../domain/dispute.dart';

String _disputeStatusText(AppLocalizations l10n, DisputeStatus status) {
  return switch (status) {
    DisputeStatus.open => l10n.disputeStatusOpen,
    DisputeStatus.underReview => l10n.disputeStatusUnderReview,
    DisputeStatus.resolved => l10n.disputeStatusResolved,
    DisputeStatus.rejected => l10n.disputeStatusRejected,
  };
}

Color _disputeStatusColor(BuildContext context, DisputeStatus status) {
  final colorScheme = Theme.of(context).colorScheme;
  final semantic = Theme.of(context).extension<SahlSemanticColors>()!;
  return switch (status) {
    DisputeStatus.open || DisputeStatus.underReview => semantic.warning,
    DisputeStatus.resolved => semantic.success,
    DisputeStatus.rejected => colorScheme.error,
  };
}

class MyDisputesScreen extends ConsumerWidget {
  const MyDisputesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final disputes = ref.watch(myDisputesControllerProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.disputeMyDisputes)),
      body: AsyncValueView<List<Dispute>>(
        value: disputes,
        onRetry: () => ref.invalidate(myDisputesControllerProvider),
        data: (context, data) {
          if (data.isEmpty) {
            return EmptyStateView(message: l10n.disputeNoDisputes);
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(myDisputesControllerProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(AppSpacing.base),
              itemCount: data.length,
              separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
              itemBuilder: (context, index) {
                final dispute = data[index];
                return Card(
                  child: ListTile(
                    title: Text(dispute.reason, maxLines: 2, overflow: TextOverflow.ellipsis),
                    subtitle: dispute.resolutionNotes != null ? Text(l10n.disputeResolutionNotes(dispute.resolutionNotes!)) : null,
                    trailing: Chip(
                      label: Text(_disputeStatusText(l10n, dispute.status)),
                      backgroundColor: _disputeStatusColor(context, dispute.status).withValues(alpha: 0.15),
                      labelStyle: TextStyle(color: _disputeStatusColor(context, dispute.status)),
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
