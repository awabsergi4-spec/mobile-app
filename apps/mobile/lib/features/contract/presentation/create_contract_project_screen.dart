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
import '../application/contract_controller.dart';
import '../domain/contract_project.dart';

class CreateContractProjectScreen extends ConsumerStatefulWidget {
  const CreateContractProjectScreen({super.key, this.initialCategoryId});

  /// Preselected from a service page.
  final String? initialCategoryId;

  @override
  ConsumerState<CreateContractProjectScreen> createState() => _CreateContractProjectScreenState();
}

class _CreateContractProjectScreenState extends ConsumerState<CreateContractProjectScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _budgetMinController = TextEditingController();
  final _budgetMaxController = TextEditingController();
  late String? _categoryId = widget.initialCategoryId;
  bool _isSubmitting = false;
  AppFailure? _failure;

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _budgetMinController.dispose();
    _budgetMaxController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_isSubmitting) return;
    if (!_formKey.currentState!.validate() || _categoryId == null) return;

    setState(() {
      _isSubmitting = true;
      _failure = null;
    });

    final result = await ref.read(myContractProjectsControllerProvider.notifier).create(
          categoryId: _categoryId!,
          title: _titleController.text.trim(),
          description: _descriptionController.text.trim(),
          budgetMin: int.tryParse(_budgetMinController.text.trim()),
          budgetMax: int.tryParse(_budgetMaxController.text.trim()),
        );

    if (!mounted) return;
    switch (result) {
      case Success<ContractProject>():
        context.pop();
      case Failure<ContractProject>(:final failure):
        setState(() {
          _isSubmitting = false;
          _failure = failure;
        });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final categories = ref.watch(serviceCategoriesProvider(ServiceType.contract));

    return Scaffold(
      appBar: AppBar(title: Text(l10n.contractNewProject)),
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
                  onRetry: () => ref.invalidate(serviceCategoriesProvider(ServiceType.contract)),
                  data: (context, data) => DropdownButtonFormField<String>(
                    initialValue: _categoryId,
                    decoration: InputDecoration(labelText: l10n.contractCategory),
                    items: data.map((c) => DropdownMenuItem(value: c.id, child: Text(c.name))).toList(),
                    onChanged: _isSubmitting ? null : (value) => setState(() => _categoryId = value),
                    validator: (value) => value == null ? l10n.validationRequired : null,
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                TextFormField(
                  controller: _titleController,
                  decoration: InputDecoration(labelText: l10n.contractTitle),
                  enabled: !_isSubmitting,
                  validator: (value) => (value == null || value.trim().length < 3) ? l10n.validationRequired : null,
                ),
                const SizedBox(height: AppSpacing.md),
                TextFormField(
                  controller: _descriptionController,
                  decoration: InputDecoration(labelText: l10n.contractDescription),
                  maxLines: 4,
                  enabled: !_isSubmitting,
                  validator: (value) => (value == null || value.trim().length < 10) ? l10n.validationRequired : null,
                ),
                const SizedBox(height: AppSpacing.md),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _budgetMinController,
                        decoration: InputDecoration(labelText: l10n.contractBudgetMin),
                        keyboardType: TextInputType.number,
                        enabled: !_isSubmitting,
                      ),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: TextFormField(
                        controller: _budgetMaxController,
                        decoration: InputDecoration(labelText: l10n.contractBudgetMax),
                        keyboardType: TextInputType.number,
                        enabled: !_isSubmitting,
                      ),
                    ),
                  ],
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
                      : Text(l10n.contractSubmit),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
