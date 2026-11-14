import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/errors/failure_localizer.dart';
import '../../../../core/l10n/generated/app_localizations.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../shared/widgets/error_banner.dart';
import '../../application/dispute_controller.dart';

/// Reusable from any milestone row (Contract or Remote) — the caller
/// supplies which entity the dispute is about; this only owns the reason
/// form and submit flow.
void showOpenDisputeSheet(BuildContext context, {required String relatedEntityType, required String relatedEntityId}) {
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
      child: _OpenDisputeForm(relatedEntityType: relatedEntityType, relatedEntityId: relatedEntityId),
    ),
  );
}

class _OpenDisputeForm extends ConsumerStatefulWidget {
  const _OpenDisputeForm({required this.relatedEntityType, required this.relatedEntityId});

  final String relatedEntityType;
  final String relatedEntityId;

  @override
  ConsumerState<_OpenDisputeForm> createState() => _OpenDisputeFormState();
}

class _OpenDisputeFormState extends ConsumerState<_OpenDisputeForm> {
  final _formKey = GlobalKey<FormState>();
  final _reasonController = TextEditingController();
  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_isSubmitting || !_formKey.currentState!.validate()) return;
    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    final l10n = AppLocalizations.of(context)!;
    final result = await ref.read(myDisputesControllerProvider.notifier).open(
          relatedEntityType: widget.relatedEntityType,
          relatedEntityId: widget.relatedEntityId,
          reason: _reasonController.text.trim(),
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
          Text(l10n.disputeOpenAction, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: AppSpacing.sm),
          TextFormField(
            controller: _reasonController,
            decoration: InputDecoration(labelText: l10n.disputeReason),
            maxLines: 3,
            enabled: !_isSubmitting,
            validator: (value) => (value == null || value.trim().length < 3) ? l10n.validationRequired : null,
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
                : Text(l10n.disputeSubmit),
          ),
        ],
      ),
    );
  }
}
