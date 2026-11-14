import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/errors/app_failure.dart';
import '../../../core/errors/failure_localizer.dart';
import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/empty_state_view.dart';
import '../../../shared/widgets/error_banner.dart';
import '../../auth/application/auth_controller.dart';
import '../application/contract_bid_controller.dart';
import '../application/contract_controller.dart';
import '../domain/contract_bid.dart';
import '../domain/contract_project.dart';
import 'widgets/contract_status_label.dart';

class ContractProjectDetailScreen extends ConsumerWidget {
  const ContractProjectDetailScreen({super.key, required this.projectId});

  final String projectId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final project = ref.watch(contractProjectDetailProvider(projectId));

    return Scaffold(
      appBar: AppBar(title: Text(l10n.contractDetailsTitle)),
      body: AsyncValueView<ContractProject>(
        value: project,
        onRetry: () => ref.invalidate(contractProjectDetailProvider(projectId)),
        data: (context, data) => _ProjectDetailBody(project: data),
      ),
    );
  }
}

class _ProjectDetailBody extends ConsumerWidget {
  const _ProjectDetailBody({required this.project});

  final ContractProject project;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final currentUserId = ref.watch(authControllerProvider).user?.id;
    final isOwner = currentUserId != null && currentUserId == project.customerId;

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.base),
      children: [
        Chip(
          label: Text(contractProjectStatusText(l10n, project.status)),
          backgroundColor: contractProjectStatusColor(context, project.status).withValues(alpha: 0.15),
          labelStyle: TextStyle(color: contractProjectStatusColor(context, project.status)),
          side: BorderSide.none,
        ),
        const SizedBox(height: AppSpacing.md),
        Text(project.title, style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: AppSpacing.sm),
        Text(project.description, style: Theme.of(context).textTheme.bodyLarge),
        if (project.budgetMin != null || project.budgetMax != null) ...[
          const SizedBox(height: AppSpacing.sm),
          Text('${project.budgetMin ?? '?'} – ${project.budgetMax ?? '?'}'),
        ],
        const SizedBox(height: AppSpacing.xxl),
        if (isOwner)
          _BidsSection(project: project)
        else if (project.status == ContractProjectStatus.openForBids)
          _SubmitBidForm(projectId: project.id),
      ],
    );
  }
}

class _BidsSection extends ConsumerWidget {
  const _BidsSection({required this.project});

  final ContractProject project;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final bids = ref.watch(projectBidsProvider(project.id));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(l10n.contractMyBids, style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: AppSpacing.sm),
        AsyncValueView<List<ContractBid>>(
          value: bids,
          onRetry: () => ref.invalidate(projectBidsProvider(project.id)),
          data: (context, data) {
            if (data.isEmpty) {
              return EmptyStateView(message: l10n.contractNoBids);
            }
            return Column(
              children: data
                  .map(
                    (bid) => Card(
                      child: ListTile(
                        title: Text(bid.amount.toString()),
                        subtitle: bid.message != null ? Text(bid.message!) : null,
                        trailing: bid.status == ContractBidStatus.submitted && project.status == ContractProjectStatus.openForBids
                            ? TextButton(
                                onPressed: () async {
                                  final result = await ref.read(contractRepositoryProvider).awardBid(bid.id);
                                  if (result.isSuccess) {
                                    ref.invalidate(contractProjectDetailProvider(project.id));
                                    ref.invalidate(projectBidsProvider(project.id));
                                  }
                                },
                                child: Text(l10n.contractAwardBid),
                              )
                            : Chip(
                                label: Text(contractBidStatusText(l10n, bid.status)),
                                backgroundColor: contractBidStatusColor(context, bid.status).withValues(alpha: 0.15),
                                labelStyle: TextStyle(color: contractBidStatusColor(context, bid.status)),
                                side: BorderSide.none,
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
}

class _SubmitBidForm extends ConsumerStatefulWidget {
  const _SubmitBidForm({required this.projectId});

  final String projectId;

  @override
  ConsumerState<_SubmitBidForm> createState() => _SubmitBidFormState();
}

class _SubmitBidFormState extends ConsumerState<_SubmitBidForm> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _messageController = TextEditingController();
  bool _isSubmitting = false;
  bool _submitted = false;
  AppFailure? _failure;

  @override
  void dispose() {
    _amountController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_isSubmitting || !_formKey.currentState!.validate()) return;
    setState(() {
      _isSubmitting = true;
      _failure = null;
    });

    final result = await ref.read(myContractBidsControllerProvider.notifier).submit(
          projectId: widget.projectId,
          amount: int.parse(_amountController.text.trim()),
          message: _messageController.text.trim(),
        );

    if (!mounted) return;
    setState(() {
      _isSubmitting = false;
      if (result.isSuccess) {
        _submitted = true;
      } else {
        result.when(success: (_) {}, failure: (f) => _failure = f);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    if (_submitted) {
      return EmptyStateView(message: contractBidStatusText(l10n, ContractBidStatus.submitted));
    }

    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(l10n.contractSubmitBid, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: AppSpacing.sm),
          TextFormField(
            controller: _amountController,
            decoration: InputDecoration(labelText: l10n.contractBidAmount),
            keyboardType: TextInputType.number,
            enabled: !_isSubmitting,
            validator: (value) => int.tryParse(value ?? '') == null ? l10n.validationRequired : null,
          ),
          const SizedBox(height: AppSpacing.sm),
          TextFormField(
            controller: _messageController,
            decoration: InputDecoration(labelText: l10n.contractBidMessage),
            maxLines: 2,
            enabled: !_isSubmitting,
          ),
          if (_failure != null) ...[
            const SizedBox(height: AppSpacing.sm),
            ErrorBanner(message: localizeFailure(l10n, _failure!)),
          ],
          const SizedBox(height: AppSpacing.md),
          FilledButton(
            onPressed: _isSubmitting ? null : _submit,
            child: _isSubmitting
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : Text(l10n.contractSubmitBid),
          ),
        ],
      ),
    );
  }
}
