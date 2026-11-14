import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/errors/app_failure.dart';
import '../../../core/errors/failure_localizer.dart';
import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/result.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/empty_state_view.dart';
import '../../../shared/widgets/error_banner.dart';
import '../../service_category/application/service_category_controller.dart';
import '../../service_category/domain/service_category.dart';
import '../application/remote_controller.dart';
import '../domain/hireable_provider.dart';
import '../domain/remote_engagement.dart';

class CreateRemoteEngagementScreen extends ConsumerStatefulWidget {
  const CreateRemoteEngagementScreen({super.key, this.initialCategoryId, this.initialProviderId});

  /// Preselected from a service page or a provider profile ("Book").
  final String? initialCategoryId;
  final String? initialProviderId;

  @override
  ConsumerState<CreateRemoteEngagementScreen> createState() => _CreateRemoteEngagementScreenState();
}

class _CreateRemoteEngagementScreenState extends ConsumerState<CreateRemoteEngagementScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _amountController = TextEditingController();
  late String? _categoryId = widget.initialCategoryId;
  late String? _providerId = widget.initialProviderId;
  PriceType _priceType = PriceType.fixed;
  bool _isSubmitting = false;
  AppFailure? _failure;

  @override
  void dispose() {
    _titleController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_isSubmitting) return;
    if (!_formKey.currentState!.validate() || _categoryId == null || _providerId == null) return;

    setState(() {
      _isSubmitting = true;
      _failure = null;
    });

    final result = await ref.read(myRemoteEngagementsControllerProvider(false).notifier).create(
          providerId: _providerId!,
          categoryId: _categoryId!,
          title: _titleController.text.trim(),
          priceType: _priceType,
          amount: int.parse(_amountController.text.trim()),
        );

    if (!mounted) return;
    switch (result) {
      case Success<RemoteEngagement>():
        context.pop();
      case Failure<RemoteEngagement>(:final failure):
        setState(() {
          _isSubmitting = false;
          _failure = failure;
        });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final categories = ref.watch(serviceCategoriesProvider(ServiceType.remote));

    return Scaffold(
      appBar: AppBar(title: Text(l10n.remoteNewEngagement)),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                AsyncValueView<List<ServiceCategory>>(
                  value: categories,
                  onRetry: () => ref.invalidate(serviceCategoriesProvider(ServiceType.remote)),
                  data: (context, data) => DropdownButtonFormField<String>(
                    initialValue: _categoryId,
                    decoration: InputDecoration(labelText: l10n.remoteCategory),
                    items: data.map((c) => DropdownMenuItem(value: c.id, child: Text(c.name))).toList(),
                    onChanged: _isSubmitting
                        ? null
                        : (value) => setState(() {
                              _categoryId = value;
                              _providerId = null;
                            }),
                    validator: (value) => value == null ? l10n.validationRequired : null,
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                if (_categoryId == null)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
                    child: Text(l10n.remoteSelectCategoryFirst, style: Theme.of(context).textTheme.bodySmall),
                  )
                else
                  Consumer(
                    builder: (context, ref, _) {
                      final providers = ref.watch(hireableProvidersProvider(_categoryId!));
                      return AsyncValueView<List<HireableProvider>>(
                        value: providers,
                        onRetry: () => ref.invalidate(hireableProvidersProvider(_categoryId!)),
                        data: (context, data) {
                          if (data.isEmpty) {
                            return EmptyStateView(message: l10n.remoteNoProvidersForCategory);
                          }
                          return DropdownButtonFormField<String>(
                            initialValue: _providerId,
                            decoration: InputDecoration(labelText: l10n.remoteProvider),
                            items: data
                                .map((p) => DropdownMenuItem(value: p.id, child: Text('${p.businessName} (${p.ratingAverage})')))
                                .toList(),
                            onChanged: _isSubmitting ? null : (value) => setState(() => _providerId = value),
                            validator: (value) => value == null ? l10n.validationRequired : null,
                          );
                        },
                      );
                    },
                  ),
                const SizedBox(height: AppSpacing.md),
                TextFormField(
                  controller: _titleController,
                  decoration: InputDecoration(labelText: l10n.remoteTitle),
                  enabled: !_isSubmitting,
                  validator: (value) => (value == null || value.trim().length < 3) ? l10n.validationRequired : null,
                ),
                const SizedBox(height: AppSpacing.md),
                DropdownButtonFormField<PriceType>(
                  initialValue: _priceType,
                  decoration: InputDecoration(labelText: l10n.remotePriceType),
                  items: [
                    DropdownMenuItem(value: PriceType.fixed, child: Text(l10n.remotePriceFixed)),
                    DropdownMenuItem(value: PriceType.hourly, child: Text(l10n.remotePriceHourly)),
                  ],
                  onChanged: _isSubmitting ? null : (value) => setState(() => _priceType = value ?? PriceType.fixed),
                ),
                const SizedBox(height: AppSpacing.md),
                TextFormField(
                  controller: _amountController,
                  decoration: InputDecoration(labelText: l10n.remoteAmount),
                  keyboardType: TextInputType.number,
                  enabled: !_isSubmitting,
                  validator: (value) => int.tryParse(value ?? '') == null ? l10n.validationRequired : null,
                ),
                if (_failure != null) ...[
                  const SizedBox(height: AppSpacing.md),
                  ErrorBanner(message: localizeFailure(l10n, _failure!)),
                ],
                const SizedBox(height: AppSpacing.xl),
                FilledButton(
                  onPressed: _isSubmitting ? null : _submit,
                  child: _isSubmitting
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                      : Text(l10n.remoteSubmit),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
