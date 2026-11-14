import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/errors/failure_localizer.dart';
import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/empty_state_view.dart';
import '../../../shared/widgets/error_banner.dart';
import '../application/withdrawal_controller.dart';
import '../domain/withdrawal.dart';
import 'widgets/withdrawal_status_label.dart';

class WithdrawalsScreen extends ConsumerWidget {
  const WithdrawalsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final withdrawals = ref.watch(myWithdrawalsControllerProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.walletWithdrawals)),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showRequestWithdrawalSheet(context),
        icon: const Icon(Icons.add),
        label: Text(l10n.walletRequestWithdrawal),
      ),
      body: AsyncValueView<List<Withdrawal>>(
        value: withdrawals,
        onRetry: () => ref.invalidate(myWithdrawalsControllerProvider),
        data: (context, data) {
          if (data.isEmpty) {
            return EmptyStateView(message: l10n.walletNoWithdrawals);
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(myWithdrawalsControllerProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(AppSpacing.base),
              itemCount: data.length,
              separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
              itemBuilder: (context, index) {
                final withdrawal = data[index];
                return Card(
                  child: ListTile(
                    title: Text('${withdrawal.amount} ${withdrawal.currency}'),
                    subtitle: withdrawal.rejectedReason != null ? Text(withdrawal.rejectedReason!) : null,
                    trailing: Chip(
                      label: Text(withdrawalStatusText(l10n, withdrawal.status)),
                      backgroundColor: withdrawalStatusColor(context, withdrawal.status).withValues(alpha: 0.15),
                      labelStyle: TextStyle(color: withdrawalStatusColor(context, withdrawal.status)),
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

  void _showRequestWithdrawalSheet(BuildContext context) {
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
        child: const _RequestWithdrawalForm(),
      ),
    );
  }
}

class _RequestWithdrawalForm extends ConsumerStatefulWidget {
  const _RequestWithdrawalForm();

  @override
  ConsumerState<_RequestWithdrawalForm> createState() => _RequestWithdrawalFormState();
}

class _RequestWithdrawalFormState extends ConsumerState<_RequestWithdrawalForm> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  WithdrawalMethod _method = WithdrawalMethod.bankTransfer;
  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void dispose() {
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
    final result = await ref
        .read(myWithdrawalsControllerProvider.notifier)
        .request(amount: int.parse(_amountController.text.trim()), method: _method);

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
            controller: _amountController,
            decoration: InputDecoration(labelText: l10n.walletWithdrawalAmount),
            keyboardType: TextInputType.number,
            enabled: !_isSubmitting,
            validator: (value) => int.tryParse(value ?? '') == null ? l10n.validationRequired : null,
          ),
          const SizedBox(height: AppSpacing.sm),
          DropdownButtonFormField<WithdrawalMethod>(
            initialValue: _method,
            decoration: InputDecoration(labelText: l10n.walletWithdrawalMethod),
            items: [
              DropdownMenuItem(value: WithdrawalMethod.bankTransfer, child: Text(l10n.walletMethodBankTransfer)),
              DropdownMenuItem(value: WithdrawalMethod.walletTransfer, child: Text(l10n.walletMethodWalletTransfer)),
              DropdownMenuItem(value: WithdrawalMethod.mobileMoney, child: Text(l10n.walletMethodMobileMoney)),
            ],
            onChanged: _isSubmitting ? null : (value) => setState(() => _method = value ?? WithdrawalMethod.bankTransfer),
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
                : Text(l10n.walletSubmitWithdrawal),
          ),
        ],
      ),
    );
  }
}
