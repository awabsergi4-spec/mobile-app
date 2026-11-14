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
import '../application/contract_controller.dart';
import '../application/contract_milestone_controller.dart';
import '../domain/contract.dart';
import '../domain/contract_milestone.dart';

class ContractDetailScreen extends ConsumerWidget {
  const ContractDetailScreen({super.key, required this.contractId});

  final String contractId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final contract = ref.watch(contractDetailProvider(contractId));

    return Scaffold(
      appBar: AppBar(title: Text(l10n.contractDetailsTitle)),
      body: AsyncValueView<Contract>(
        value: contract,
        onRetry: () => ref.invalidate(contractDetailProvider(contractId)),
        data: (context, data) => _ContractDetailBody(contract: data),
      ),
    );
  }
}

class _ContractDetailBody extends ConsumerWidget {
  const _ContractDetailBody({required this.contract});

  final Contract contract;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final tokens = context.sahl;
    final milestones = ref.watch(contractMilestonesControllerProvider(contract.id));
    final isCustomer = ref.watch(authControllerProvider).user?.workspace == UserWorkspace.customer;
    final (statusLabel, statusColor) = switch (contract.status) {
      ContractStatus.inProgress => (l10n.contractStatusInProgress, tokens.info),
      ContractStatus.completed => (l10n.contractStatusCompleted, tokens.success),
      ContractStatus.disputed => (l10n.contractStatusDisputed, tokens.warning),
      ContractStatus.cancelled => (l10n.contractStatusCancelled, Theme.of(context).colorScheme.error),
    };

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(contractDetailProvider(contract.id));
        ref.invalidate(contractMilestonesControllerProvider(contract.id));
      },
      child: ListView(
        padding: const EdgeInsets.all(AppSpacing.base),
        children: [
          SahlCard(
            child: Row(
              children: [
                IconBadge(icon: Symbols.handshake, color: statusColor, size: 52),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(l10n.contractTotal, style: TextStyle(color: tokens.textMuted, fontSize: 12)),
                      Text(
                        Fmt.number(context, contract.totalAmount),
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 2),
                      Text(Fmt.date(context, contract.startedAt), style: TextStyle(color: tokens.textMuted, fontSize: 12)),
                    ],
                  ),
                ),
                Text(statusLabel, style: TextStyle(color: statusColor, fontWeight: FontWeight.w800)),
              ],
            ),
          ),
          SectionHeader(
            title: l10n.contractMilestones,
            actionLabel: isCustomer && contract.status == ContractStatus.inProgress ? l10n.contractNewMilestone : null,
            onAction: () => _showCreateMilestoneSheet(context, ref, contract.id),
          ),
          AsyncValueView<List<ContractMilestone>>(
            value: milestones,
            loading: const SizedBox(height: 160, child: SkeletonList(itemCount: 2)),
            onRetry: () => ref.invalidate(contractMilestonesControllerProvider(contract.id)),
            data: (context, data) {
              if (data.isEmpty) {
                return EmptyStateView(message: l10n.contractNoMilestones);
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
                        final result = await ref.read(contractRepositoryProvider).updateMilestoneStatus(m.id, to);
                        if (result.isSuccess) {
                          ref.invalidate(contractMilestonesControllerProvider(contract.id));
                          ref.invalidate(contractDetailProvider(contract.id));
                        }
                        return result;
                      },
                      onDispute: () => showOpenDisputeSheet(context, relatedEntityType: 'CONTRACT_MILESTONE', relatedEntityId: m.id),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                  ],
                ],
              );
            },
          ),
          if (isCustomer && contract.status == ContractStatus.completed) ...[
            const SizedBox(height: AppSpacing.lg),
            ReviewSection(type: ReviewJobType.contract, jobId: contract.id),
          ],
        ],
      ),
    );
  }

  void _showCreateMilestoneSheet(BuildContext context, WidgetRef ref, String contractId) {
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
        child: _CreateMilestoneForm(contractId: contractId),
      ),
    );
  }
}

class _CreateMilestoneForm extends ConsumerStatefulWidget {
  const _CreateMilestoneForm({required this.contractId});

  final String contractId;

  @override
  ConsumerState<_CreateMilestoneForm> createState() => _CreateMilestoneFormState();
}

class _CreateMilestoneFormState extends ConsumerState<_CreateMilestoneForm> {
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
    final result = await ref.read(contractMilestonesControllerProvider(widget.contractId).notifier).create(
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
                : Text(l10n.contractNewMilestone),
          ),
        ],
      ),
    );
  }
}
