import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/errors/app_failure.dart';
import '../../../core/errors/failure_localizer.dart';
import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/result.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/error_banner.dart';
import '../../service_category/application/service_category_controller.dart';
import '../../service_category/domain/service_category.dart';
import '../application/on_demand_controller.dart';
import '../domain/on_demand_request.dart';

class CreateOnDemandRequestScreen extends ConsumerStatefulWidget {
  const CreateOnDemandRequestScreen({super.key});

  @override
  ConsumerState<CreateOnDemandRequestScreen> createState() => _CreateOnDemandRequestScreenState();
}

class _CreateOnDemandRequestScreenState extends ConsumerState<CreateOnDemandRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  final _descriptionController = TextEditingController();
  final _latController = TextEditingController();
  final _lngController = TextEditingController();
  String? _categoryId;
  bool _isEmergency = false;
  bool _isSubmitting = false;
  AppFailure? _failure;

  @override
  void dispose() {
    _descriptionController.dispose();
    _latController.dispose();
    _lngController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_isSubmitting) return;
    if (!_formKey.currentState!.validate() || _categoryId == null) return;

    setState(() {
      _isSubmitting = true;
      _failure = null;
    });

    final result = await ref.read(myOnDemandRequestsControllerProvider.notifier).create(
          categoryId: _categoryId!,
          description: _descriptionController.text.trim(),
          lat: double.parse(_latController.text.trim()),
          lng: double.parse(_lngController.text.trim()),
          isEmergency: _isEmergency,
        );

    if (!mounted) return;
    switch (result) {
      case Success<OnDemandRequest>():
        context.pop();
      case Failure<OnDemandRequest>(:final failure):
        setState(() {
          _isSubmitting = false;
          _failure = failure;
        });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final categories = ref.watch(serviceCategoriesProvider(ServiceType.onDemand));

    return Scaffold(
      appBar: AppBar(title: Text(l10n.onDemandNewRequest)),
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
                  onRetry: () => ref.invalidate(serviceCategoriesProvider(ServiceType.onDemand)),
                  data: (context, data) => DropdownButtonFormField<String>(
                    initialValue: _categoryId,
                    decoration: InputDecoration(labelText: l10n.onDemandCategory),
                    items: data.map((c) => DropdownMenuItem(value: c.id, child: Text(c.name))).toList(),
                    onChanged: _isSubmitting ? null : (value) => setState(() => _categoryId = value),
                    validator: (value) => value == null ? l10n.validationRequired : null,
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                TextFormField(
                  controller: _descriptionController,
                  decoration: InputDecoration(labelText: l10n.onDemandDescription),
                  maxLines: 3,
                  enabled: !_isSubmitting,
                  validator: (value) => (value == null || value.trim().length < 5) ? l10n.validationRequired : null,
                ),
                const SizedBox(height: AppSpacing.md),
                Text(l10n.onDemandLocationHint, style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: AppSpacing.sm),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _latController,
                        decoration: InputDecoration(labelText: l10n.onDemandLatitude),
                        keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
                        enabled: !_isSubmitting,
                        validator: (value) => double.tryParse(value ?? '') == null ? l10n.validationRequired : null,
                      ),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: TextFormField(
                        controller: _lngController,
                        decoration: InputDecoration(labelText: l10n.onDemandLongitude),
                        keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
                        enabled: !_isSubmitting,
                        validator: (value) => double.tryParse(value ?? '') == null ? l10n.validationRequired : null,
                      ),
                    ),
                  ],
                ),
                CheckboxListTile(
                  value: _isEmergency,
                  onChanged: _isSubmitting ? null : (value) => setState(() => _isEmergency = value ?? false),
                  title: Text(l10n.onDemandEmergency),
                  controlAffinity: ListTileControlAffinity.leading,
                  contentPadding: EdgeInsets.zero,
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
                      : Text(l10n.onDemandSubmit),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
