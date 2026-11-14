import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/empty_state_view.dart';
import '../application/on_demand_assignment_controller.dart';
import '../domain/on_demand_assignment.dart';

class ProviderAssignmentListScreen extends ConsumerWidget {
  const ProviderAssignmentListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final assignments = ref.watch(myAssignmentsControllerProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.onDemandJobOffers)),
      body: AsyncValueView<List<OnDemandAssignment>>(
        value: assignments,
        onRetry: () => ref.invalidate(myAssignmentsControllerProvider),
        data: (context, data) {
          final offered = data.where((a) => a.status == AssignmentStatus.offered).toList();
          if (offered.isEmpty) {
            return EmptyStateView(message: l10n.onDemandNoOffers);
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(myAssignmentsControllerProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(AppSpacing.base),
              itemCount: offered.length,
              separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
              itemBuilder: (context, index) => _AssignmentCard(assignment: offered[index]),
            ),
          );
        },
      ),
    );
  }
}

class _AssignmentCard extends ConsumerStatefulWidget {
  const _AssignmentCard({required this.assignment});

  final OnDemandAssignment assignment;

  @override
  ConsumerState<_AssignmentCard> createState() => _AssignmentCardState();
}

class _AssignmentCardState extends ConsumerState<_AssignmentCard> {
  bool _isResponding = false;

  Future<void> _respond(bool accept) async {
    setState(() => _isResponding = true);
    final notifier = ref.read(myAssignmentsControllerProvider.notifier);
    final result = accept ? await notifier.accept(widget.assignment.id) : await notifier.decline(widget.assignment.id);
    if (!mounted) return;
    if (!result.isSuccess) {
      setState(() => _isResponding = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.base),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (widget.assignment.requestIsEmergency)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.xs),
                child: Wrap(
                  children: [
                    Chip(
                      label: Text(l10n.onDemandEmergencyBadge),
                      backgroundColor: Theme.of(context).colorScheme.errorContainer,
                      labelStyle: TextStyle(color: Theme.of(context).colorScheme.onErrorContainer),
                      side: BorderSide.none,
                    ),
                  ],
                ),
              ),
            if (widget.assignment.requestDescription != null)
              Text(widget.assignment.requestDescription!, style: Theme.of(context).textTheme.bodyLarge),
            if (widget.assignment.quotedPrice != null) ...[
              const SizedBox(height: AppSpacing.xs),
              Text(l10n.onDemandQuotedPrice(widget.assignment.quotedPrice.toString())),
            ],
            const SizedBox(height: AppSpacing.sm),
            if (_isResponding)
              const Align(alignment: Alignment.centerRight, child: CircularProgressIndicator(strokeWidth: 2))
            else
              Wrap(
                alignment: WrapAlignment.end,
                spacing: AppSpacing.sm,
                children: [
                  OutlinedButton(onPressed: () => _respond(false), child: Text(l10n.onDemandDecline)),
                  FilledButton(onPressed: () => _respond(true), child: Text(l10n.onDemandAccept)),
                ],
              ),
          ],
        ),
      ),
    );
  }
}
