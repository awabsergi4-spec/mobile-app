import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../../core/errors/app_failure.dart';
import '../../../core/errors/failure_localizer.dart';
import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/utils/formatters.dart';
import '../../../shared/widgets/sahl_ui.dart';
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

class _ProjectDetailBody extends ConsumerStatefulWidget {
  const _ProjectDetailBody({required this.project});

  final ContractProject project;

  @override
  ConsumerState<_ProjectDetailBody> createState() => _ProjectDetailBodyState();
}

class _ProjectDetailBodyState extends ConsumerState<_ProjectDetailBody> {
  bool _cancelling = false;

  Future<void> _cancel() async {
    final l10n = AppLocalizations.of(context)!;
    final confirmed = await showConfirmDialog(
      context,
      title: l10n.cancelProjectConfirm,
      message: l10n.cancelProjectMessage,
      confirmLabel: l10n.cancelProject,
      destructive: true,
    );
    if (!confirmed || !mounted) return;
    setState(() => _cancelling = true);
    final result = await ref.read(contractRepositoryProvider).cancelProject(widget.project.id);
    if (!mounted) return;
    setState(() => _cancelling = false);
    result.when(
      success: (_) {
        ref.invalidate(contractProjectDetailProvider(widget.project.id));
        ref.invalidate(myContractProjectsControllerProvider);
      },
      failure: (f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(localizeFailure(l10n, f)))),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final project = widget.project;
    final tokens = context.sahl;
    final currentUserId = ref.watch(authControllerProvider).user?.id;
    final isOwner = currentUserId != null && currentUserId == project.customerId;
    final color = contractProjectStatusColor(context, project.status);

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.base),
      children: [
        SahlCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  IconBadge(icon: Symbols.handshake, color: color),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Text(contractProjectStatusText(l10n, project.status), style: TextStyle(color: color, fontWeight: FontWeight.w800)),
                  ),
                  Text(Fmt.date(context, project.createdAt), style: TextStyle(color: tokens.textMuted, fontSize: 12)),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              Text(project.title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
              const SizedBox(height: AppSpacing.sm),
              Text(project.description, style: const TextStyle(height: 1.5)),
              if (project.budgetMin != null || project.budgetMax != null) ...[
                const SizedBox(height: AppSpacing.md),
                StatusChip(
                  label: '${l10n.projectBudget}: ${Fmt.priceRange(context, project.budgetMin, project.budgetMax)}',
                  icon: Symbols.payments,
                  tone: StatusTone.brand,
                ),
              ],
            ],
          ),
        ),
        if (isOwner && project.contractId != null) ...[
          const SizedBox(height: AppSpacing.md),
          FilledButton.icon(
            onPressed: () => context.push('/contracts/${project.contractId}'),
            icon: const Icon(Symbols.description),
            label: Text(l10n.viewContract),
          ),
        ],
        const SizedBox(height: AppSpacing.lg),
        if (isOwner)
          _BidsSection(project: project)
        else if (project.status == ContractProjectStatus.openForBids)
          _SubmitBidForm(projectId: project.id),
        if (isOwner && project.status == ContractProjectStatus.openForBids) ...[
          const SizedBox(height: AppSpacing.xl),
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(foregroundColor: Theme.of(context).colorScheme.error),
            onPressed: _cancelling ? null : _cancel,
            icon: _cancelling
                ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Symbols.cancel),
            label: Text(l10n.cancelProject),
          ),
        ],
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
