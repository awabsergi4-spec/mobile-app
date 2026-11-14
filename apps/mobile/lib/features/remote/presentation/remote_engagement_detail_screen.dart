import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/errors/failure_localizer.dart';
import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/empty_state_view.dart';
import '../../../shared/widgets/error_banner.dart';
import '../../dispute/presentation/widgets/open_dispute_sheet.dart';
import '../application/remote_controller.dart';
import '../application/remote_milestone_controller.dart';
import '../domain/remote_engagement.dart';
import '../domain/remote_milestone.dart';
import 'widgets/remote_status_label.dart';

class RemoteEngagementDetailScreen extends ConsumerWidget {
  const RemoteEngagementDetailScreen({super.key, required this.engagementId});

  final String engagementId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final engagement = ref.watch(remoteEngagementDetailProvider(engagementId));

    return Scaffold(
      appBar: AppBar(title: Text(l10n.remoteDetailsTitle)),
      body: AsyncValueView<RemoteEngagement>(
        value: engagement,
        onRetry: () => ref.invalidate(remoteEngagementDetailProvider(engagementId)),
        data: (context, data) => _EngagementDetailBody(engagement: data),
      ),
    );
  }
}

class _EngagementDetailBody extends ConsumerWidget {
  const _EngagementDetailBody({required this.engagement});

  final RemoteEngagement engagement;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final milestones = ref.watch(remoteMilestonesControllerProvider(engagement.id));

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.base),
      children: [
        Chip(
          label: Text(remoteEngagementStatusText(l10n, engagement.status)),
          backgroundColor: remoteEngagementStatusColor(context, engagement.status).withValues(alpha: 0.15),
          labelStyle: TextStyle(color: remoteEngagementStatusColor(context, engagement.status)),
          side: BorderSide.none,
        ),
        const SizedBox(height: AppSpacing.md),
        Text(engagement.title, style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: AppSpacing.sm),
        Text(engagement.amount.toString(), style: Theme.of(context).textTheme.bodyLarge),
        const SizedBox(height: AppSpacing.xxl),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(l10n.remoteMilestones, style: Theme.of(context).textTheme.titleMedium),
            TextButton.icon(
              onPressed: () => _showCreateMilestoneSheet(context, ref, engagement.id),
              icon: const Icon(Icons.add),
              label: Text(l10n.remoteNewMilestone),
            ),
          ],
        ),
        AsyncValueView<List<RemoteMilestone>>(
          value: milestones,
          onRetry: () => ref.invalidate(remoteMilestonesControllerProvider(engagement.id)),
          data: (context, data) {
            if (data.isEmpty) {
              return EmptyStateView(message: l10n.remoteNoMilestones);
            }
            return Column(
              children: data
                  .map(
                    (m) => Card(
                      child: ListTile(
                        title: Text(m.title),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(m.amount.toString()),
                            IconButton(
                              icon: const Icon(Icons.flag_outlined),
                              tooltip: l10n.disputeOpenAction,
                              onPressed: () => showOpenDisputeSheet(
                                context,
                                relatedEntityType: 'REMOTE_MILESTONE',
                                relatedEntityId: m.id,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  )
                  .toList(),
            );
          },
        ),
      ],
    );
  }

  void _showCreateMilestoneSheet(BuildContext context, WidgetRef ref, String engagementId) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          left: AppSpacing.xl,
          right: AppSpacing.xl,
          top: AppSpacing.xl,
          bottom: MediaQuery.of(context).viewInsets.bottom + AppSpacing.xl,
        ),
        child: _CreateRemoteMilestoneForm(engagementId: engagementId),
      ),
    );
  }
}

class _CreateRemoteMilestoneForm extends ConsumerStatefulWidget {
  const _CreateRemoteMilestoneForm({required this.engagementId});

  final String engagementId;

  @override
  ConsumerState<_CreateRemoteMilestoneForm> createState() => _CreateRemoteMilestoneFormState();
}

class _CreateRemoteMilestoneFormState extends ConsumerState<_CreateRemoteMilestoneForm> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _amountController = TextEditingController();
  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void dispose() {
    _titleController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_isSubmitting || !_formKey.currentState!.validate()) return;
    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    final l10n = AppLocalizations.of(context)!;
    final result = await ref.read(remoteMilestonesControllerProvider(widget.engagementId).notifier).create(
          title: _titleController.text.trim(),
          amount: int.parse(_amountController.text.trim()),
        );

    if (!mounted) return;
    result.when(
      success: (_) => Navigator.of(context).pop(),
      failure: (failure) => setState(() {
        _isSubmitting = false;
        _errorMessage = localizeFailure(l10n, failure);
      }),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Form(
      key: _formKey,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextFormField(
            controller: _titleController,
            decoration: InputDecoration(labelText: l10n.contractMilestoneTitle),
            enabled: !_isSubmitting,
            validator: (value) => (value == null || value.trim().length < 2) ? l10n.validationRequired : null,
          ),
          const SizedBox(height: AppSpacing.sm),
          TextFormField(
            controller: _amountController,
            decoration: InputDecoration(labelText: l10n.contractMilestoneAmount),
            keyboardType: TextInputType.number,
            enabled: !_isSubmitting,
            validator: (value) => int.tryParse(value ?? '') == null ? l10n.validationRequired : null,
          ),
          if (_errorMessage != null) ...[
            const SizedBox(height: AppSpacing.sm),
            ErrorBanner(message: _errorMessage!),
          ],
          const SizedBox(height: AppSpacing.md),
          FilledButton(
            onPressed: _isSubmitting ? null : _submit,
            child: _isSubmitting
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : Text(l10n.remoteNewMilestone),
          ),
        ],
      ),
    );
  }
}
