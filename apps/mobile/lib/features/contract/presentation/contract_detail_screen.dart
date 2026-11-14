import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/errors/failure_localizer.dart';
import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/empty_state_view.dart';
import '../../../shared/widgets/error_banner.dart';
import '../../dispute/presentation/widgets/open_dispute_sheet.dart';
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
    final milestones = ref.watch(contractMilestonesControllerProvider(contract.id));

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.base),
      children: [
        Text(contract.totalAmount.toString(), style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: AppSpacing.xxl),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(l10n.contractMilestones, style: Theme.of(context).textTheme.titleMedium),
            TextButton.icon(
              onPressed: () => _showCreateMilestoneSheet(context, ref, contract.id),
              icon: const Icon(Icons.add),
              label: Text(l10n.contractNewMilestone),
            ),
          ],
        ),
        AsyncValueView<List<ContractMilestone>>(
          value: milestones,
          onRetry: () => ref.invalidate(contractMilestonesControllerProvider(contract.id)),
          data: (context, data) {
            if (data.isEmpty) {
              return EmptyStateView(message: l10n.contractNoMilestones);
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
                                relatedEntityType: 'CONTRACT_MILESTONE',
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
