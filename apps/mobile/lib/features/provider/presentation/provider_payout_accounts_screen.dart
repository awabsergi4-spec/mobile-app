import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/errors/failure_localizer.dart';
import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/empty_state_view.dart';
import '../../../shared/widgets/error_banner.dart';
import '../../wallet/domain/withdrawal.dart';
import '../application/provider_payout_accounts_controller.dart';
import '../domain/provider_payout_account.dart';

String _payoutMethodText(AppLocalizations l10n, WithdrawalMethod method) {
  return switch (method) {
    WithdrawalMethod.bankTransfer => l10n.walletMethodBankTransfer,
    WithdrawalMethod.walletTransfer => l10n.walletMethodWalletTransfer,
    WithdrawalMethod.mobileMoney => l10n.walletMethodMobileMoney,
  };
}

class ProviderPayoutAccountsScreen extends ConsumerWidget {
  const ProviderPayoutAccountsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final accounts = ref.watch(providerPayoutAccountsControllerProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.providerPayoutAccountsTitle)),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddAccountSheet(context),
        icon: const Icon(Icons.add_card_outlined),
        label: Text(l10n.providerAddPayoutAccount),
      ),
      body: AsyncValueView<List<ProviderPayoutAccount>>(
        value: accounts,
        onRetry: () => ref.invalidate(providerPayoutAccountsControllerProvider),
        data: (context, data) {
          if (data.isEmpty) {
            return EmptyStateView(message: l10n.providerNoPayoutAccounts);
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(providerPayoutAccountsControllerProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(AppSpacing.base),
              itemCount: data.length,
              separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
              itemBuilder: (context, index) {
                final account = data[index];
                return Card(
                  child: ListTile(
                    title: Text(_payoutMethodText(l10n, account.method)),
                    subtitle: Text(account.accountDetails.values.map((v) => v.toString()).join(' · ')),
                    leading: account.isDefault ? Chip(label: Text(l10n.providerDefaultBadge)) : null,
                    trailing: PopupMenuButton<String>(
                      onSelected: (value) {
                        if (value == 'default') {
                          ref.read(providerPayoutAccountsControllerProvider.notifier).setDefault(account.id);
                        } else if (value == 'delete') {
                          ref.read(providerPayoutAccountsControllerProvider.notifier).deleteAccount(account.id);
                        }
                      },
                      itemBuilder: (context) => [
                        if (!account.isDefault) PopupMenuItem(value: 'default', child: Text(l10n.providerSetDefault)),
                        PopupMenuItem(value: 'delete', child: Text(l10n.providerDeleteItem)),
                      ],
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

  void _showAddAccountSheet(BuildContext context) {
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
        child: const _AddPayoutAccountForm(),
      ),
    );
  }
}

class _AddPayoutAccountForm extends ConsumerStatefulWidget {
  const _AddPayoutAccountForm();

  @override
  ConsumerState<_AddPayoutAccountForm> createState() => _AddPayoutAccountFormState();
}

class _AddPayoutAccountFormState extends ConsumerState<_AddPayoutAccountForm> {
  final _formKey = GlobalKey<FormState>();
  final _field1Controller = TextEditingController();
  final _field2Controller = TextEditingController();
  final _field3Controller = TextEditingController();
  WithdrawalMethod _method = WithdrawalMethod.bankTransfer;
  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void dispose() {
    _field1Controller.dispose();
    _field2Controller.dispose();
    _field3Controller.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_isSubmitting || !_formKey.currentState!.validate()) return;
    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    final l10n = AppLocalizations.of(context)!;
    final accountDetails = switch (_method) {
      WithdrawalMethod.bankTransfer => {
          'bankName': _field1Controller.text.trim(),
          'accountNumber': _field2Controller.text.trim(),
          'accountHolderName': _field3Controller.text.trim(),
        },
      WithdrawalMethod.walletTransfer => {'walletPhone': _field1Controller.text.trim()},
      WithdrawalMethod.mobileMoney => {
          'mobileMoneyProvider': _field1Controller.text.trim(),
          'phoneNumber': _field2Controller.text.trim(),
        },
    };

    final result = await ref
        .read(providerPayoutAccountsControllerProvider.notifier)
        .addAccount(method: _method, accountDetails: accountDetails);

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
          const SizedBox(height: AppSpacing.sm),
          ..._buildMethodFields(l10n),
          if (_errorMessage != null) ...[
            const SizedBox(height: AppSpacing.sm),
            ErrorBanner(message: _errorMessage!),
          ],
          const SizedBox(height: AppSpacing.md),
          FilledButton(
            onPressed: _isSubmitting ? null : _submit,
            child: _isSubmitting
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : Text(l10n.providerAddPayoutAccount),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildMethodFields(AppLocalizations l10n) {
    switch (_method) {
      case WithdrawalMethod.bankTransfer:
        return [
          TextFormField(
            controller: _field1Controller,
            decoration: InputDecoration(labelText: l10n.providerBankName),
            enabled: !_isSubmitting,
            validator: (value) => (value == null || value.trim().isEmpty) ? l10n.validationRequired : null,
          ),
          const SizedBox(height: AppSpacing.sm),
          TextFormField(
            controller: _field2Controller,
            decoration: InputDecoration(labelText: l10n.providerAccountNumber),
            enabled: !_isSubmitting,
            validator: (value) => (value == null || value.trim().isEmpty) ? l10n.validationRequired : null,
          ),
          const SizedBox(height: AppSpacing.sm),
          TextFormField(
            controller: _field3Controller,
            decoration: InputDecoration(labelText: l10n.providerAccountHolderName),
            enabled: !_isSubmitting,
            validator: (value) => (value == null || value.trim().isEmpty) ? l10n.validationRequired : null,
          ),
        ];
      case WithdrawalMethod.walletTransfer:
        return [
          TextFormField(
            controller: _field1Controller,
            decoration: InputDecoration(labelText: l10n.providerWalletPhone),
            keyboardType: TextInputType.phone,
            enabled: !_isSubmitting,
            validator: (value) => (value == null || value.trim().length < 8) ? l10n.validationPhoneInvalid : null,
          ),
        ];
      case WithdrawalMethod.mobileMoney:
        return [
          TextFormField(
            controller: _field1Controller,
            decoration: InputDecoration(labelText: l10n.providerMobileMoneyProvider),
            enabled: !_isSubmitting,
            validator: (value) => (value == null || value.trim().isEmpty) ? l10n.validationRequired : null,
          ),
          const SizedBox(height: AppSpacing.sm),
          TextFormField(
            controller: _field2Controller,
            decoration: InputDecoration(labelText: l10n.providerPhoneNumber),
            keyboardType: TextInputType.phone,
            enabled: !_isSubmitting,
            validator: (value) => (value == null || value.trim().length < 8) ? l10n.validationPhoneInvalid : null,
          ),
        ];
    }
  }
}
