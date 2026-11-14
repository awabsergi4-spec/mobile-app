import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../../core/errors/failure_localizer.dart';
import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/empty_state_view.dart';
import '../../../shared/widgets/error_banner.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/utils/formatters.dart';
import '../../../shared/widgets/milestone_tile.dart';
import '../../../shared/widgets/sahl_ui.dart';
import '../../account/domain/account_models.dart';
import '../../account/presentation/widgets/review_section.dart';
import '../../auth/application/auth_controller.dart';
import '../../auth/domain/current_user.dart';
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
    final isCustomer = ref.watch(authControllerProvider).user?.workspace == UserWorkspace.customer;
    final color = remoteEngagementStatusColor(context, engagement.status);

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(remoteEngagementDetailProvider(engagement.id));
        ref.invalidate(remoteMilestonesControllerProvider(engagement.id));
      },
      child: ListView(
        padding: const EdgeInsets.all(AppSpacing.base),
        children: [
          SahlCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    IconBadge(icon: Symbols.laptop_mac, color: color),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Text(
                        remoteEngagementStatusText(l10n, engagement.status),
                        style: TextStyle(color: color, fontWeight: FontWeight.w800),
                      ),
                    ),
                    Text(Fmt.date(context, engagement.createdAt), style: TextStyle(color: context.sahl.textMuted, fontSize: 12)),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                Text(engagement.title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: AppSpacing.xs),
                Text(Fmt.number(context, engagement.amount), style: Theme.of(context).textTheme.titleMedium),
              ],
            ),
          ),
          SectionHeader(
            title: l10n.remoteMilestones,
            actionLabel: isCustomer && engagement.status == RemoteEngagementStatus.active ? l10n.remoteNewMilestone : null,
            onAction: () => _showCreateMilestoneSheet(context, ref, engagement.id),
          ),
          AsyncValueView<List<RemoteMilestone>>(
            value: milestones,
            loading: const SizedBox(height: 160, child: SkeletonList(itemCount: 2)),
            onRetry: () => ref.invalidate(remoteMilestonesControllerProvider(engagement.id)),
            data: (context, data) {
              if (data.isEmpty) {
                return EmptyStateView(message: l10n.remoteNoMilestones);
              }
              return Column(
                children: [
                  for (final m in data) ...[
                    MilestoneTile(
                      title: m.title,
                      amount: m.amount,
                      status: m.statusWire,
                      isCustomer: isCustomer,
                      onChangeStatus: (to) async {
                        final result = await ref.read(remoteRepositoryProvider).updateMilestoneStatus(m.id, to);
                        if (result.isSuccess) {
                          ref.invalidate(remoteMilestonesControllerProvider(engagement.id));
                          ref.invalidate(remoteEngagementDetailProvider(engagement.id));
                        }
                        return result;
                      },
                      onDispute: () => showOpenDisputeSheet(context, relatedEntityType: 'REMOTE_MILESTONE', relatedEntityId: m.id),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                  ],
                ],
              );
            },
          ),
          if (isCustomer && engagement.status == RemoteEngagementStatus.completed) ...[
            const SizedBox(height: AppSpacing.lg),
            ReviewSection(type: ReviewJobType.remote, jobId: engagement.id),
          ],
        ],
      ),
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
