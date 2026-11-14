import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/errors/failure_localizer.dart';
import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/empty_state_view.dart';
import '../../../shared/widgets/error_banner.dart';
import '../application/provider_portfolio_controller.dart';
import '../domain/provider_portfolio_item.dart';

class ProviderPortfolioScreen extends ConsumerWidget {
  const ProviderPortfolioScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final portfolio = ref.watch(providerPortfolioControllerProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.providerPortfolioTitle)),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddItemSheet(context),
        icon: const Icon(Icons.add_photo_alternate_outlined),
        label: Text(l10n.providerAddPortfolioItem),
      ),
      body: AsyncValueView<List<ProviderPortfolioItem>>(
        value: portfolio,
        onRetry: () => ref.invalidate(providerPortfolioControllerProvider),
        data: (context, data) {
          if (data.isEmpty) {
            return EmptyStateView(message: l10n.providerNoPortfolioItems);
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(providerPortfolioControllerProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(AppSpacing.base),
              itemCount: data.length,
              separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
              itemBuilder: (context, index) {
                final item = data[index];
                return Card(
                  child: ListTile(
                    title: Text(item.title ?? item.mediaUrl, maxLines: 1, overflow: TextOverflow.ellipsis),
                    subtitle: item.description != null ? Text(item.description!, maxLines: 2, overflow: TextOverflow.ellipsis) : null,
                    trailing: IconButton(
                      icon: const Icon(Icons.delete_outline),
                      tooltip: l10n.providerDeleteItem,
                      onPressed: () => ref.read(providerPortfolioControllerProvider.notifier).deleteItem(item.id),
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

  void _showAddItemSheet(BuildContext context) {
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
        child: const _AddPortfolioItemForm(),
      ),
    );
  }
}

class _AddPortfolioItemForm extends ConsumerStatefulWidget {
  const _AddPortfolioItemForm();

  @override
  ConsumerState<_AddPortfolioItemForm> createState() => _AddPortfolioItemFormState();
}

class _AddPortfolioItemFormState extends ConsumerState<_AddPortfolioItemForm> {
  final _formKey = GlobalKey<FormState>();
  final _mediaUrlController = TextEditingController();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void dispose() {
    _mediaUrlController.dispose();
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_isSubmitting || !_formKey.currentState!.validate()) return;
    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    final l10n = AppLocalizations.of(context)!;
    final result = await ref.read(providerPortfolioControllerProvider.notifier).addItem(
          mediaUrl: _mediaUrlController.text.trim(),
          title: _titleController.text.trim().isEmpty ? null : _titleController.text.trim(),
          description: _descriptionController.text.trim().isEmpty ? null : _descriptionController.text.trim(),
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
            controller: _mediaUrlController,
            decoration: InputDecoration(labelText: l10n.providerPortfolioMediaUrl),
            keyboardType: TextInputType.url,
            enabled: !_isSubmitting,
            validator: (value) => (value == null || Uri.tryParse(value.trim())?.isAbsolute != true) ? l10n.validationRequired : null,
          ),
          const SizedBox(height: AppSpacing.sm),
          TextFormField(
            controller: _titleController,
            decoration: InputDecoration(labelText: l10n.providerPortfolioItemTitle),
            enabled: !_isSubmitting,
          ),
          const SizedBox(height: AppSpacing.sm),
          TextFormField(
            controller: _descriptionController,
            decoration: InputDecoration(labelText: l10n.providerPortfolioItemDescription),
            maxLines: 3,
            enabled: !_isSubmitting,
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
                : Text(l10n.providerAddPortfolioItem),
          ),
        ],
      ),
    );
  }
}
