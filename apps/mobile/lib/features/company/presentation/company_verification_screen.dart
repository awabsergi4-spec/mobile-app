import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/errors/failure_localizer.dart';
import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/empty_state_view.dart';
import '../../../shared/widgets/error_banner.dart';
import '../application/company_controller.dart';
import '../application/company_documents_controller.dart';
import '../domain/company.dart';
import '../domain/company_document.dart';
import 'widgets/company_document_status_label.dart';
import '../../../shared/media/image_upload_field.dart';
import '../../../shared/media/media_uploader.dart';
import '../../../shared/utils/document_types.dart';

class CompanyVerificationScreen extends ConsumerStatefulWidget {
  const CompanyVerificationScreen({super.key, required this.companyId});

  final String companyId;

  @override
  ConsumerState<CompanyVerificationScreen> createState() => _CompanyVerificationScreenState();
}

class _CompanyVerificationScreenState extends ConsumerState<CompanyVerificationScreen> {
  bool _isSubmittingVerification = false;
  String? _submitError;

  Future<void> _submitVerification() async {
    setState(() {
      _isSubmittingVerification = true;
      _submitError = null;
    });

    final l10n = AppLocalizations.of(context)!;
    final result = await ref.read(companyDocumentsControllerProvider(widget.companyId).notifier).submitVerification();

    if (!mounted) return;
    result.when(
      success: (_) {
        setState(() => _isSubmittingVerification = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.companyVerificationSubmitted)));
      },
      failure: (failure) => setState(() {
        _isSubmittingVerification = false;
        _submitError = localizeFailure(l10n, failure);
      }),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final company = ref.watch(companyControllerProvider(widget.companyId));
    final documents = ref.watch(companyDocumentsControllerProvider(widget.companyId));

    return Scaffold(
      appBar: AppBar(title: Text(l10n.companyDocumentsTitle)),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddDocumentSheet(context),
        icon: const Icon(Icons.upload_file),
        label: Text(l10n.companyAddDocument),
      ),
      body: AsyncValueView<List<CompanyDocument>>(
        value: documents,
        onRetry: () => ref.invalidate(companyDocumentsControllerProvider(widget.companyId)),
        data: (context, data) {
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(companyDocumentsControllerProvider(widget.companyId)),
            child: ListView(
              padding: const EdgeInsets.all(AppSpacing.base),
              children: [
                AsyncValueView<Company>(
                  value: company,
                  data: (context, companyData) => Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.md),
                    child: Text(l10n.companyVerificationStatus(companyData.verificationStatus)),
                  ),
                ),
                if (data.isEmpty)
                  EmptyStateView(message: l10n.companyNoDocuments)
                else
                  ...data.map((doc) => Card(
                        child: ListTile(
                          title: Text(documentTypeLabel(l10n, doc.type)),
                          subtitle: Text(doc.fileUrl, maxLines: 1, overflow: TextOverflow.ellipsis),
                          trailing: Chip(
                            label: Text(companyDocumentStatusText(l10n, doc.status)),
                            backgroundColor: companyDocumentStatusColor(context, doc.status).withValues(alpha: 0.15),
                            labelStyle: TextStyle(color: companyDocumentStatusColor(context, doc.status)),
                            side: BorderSide.none,
                          ),
                        ),
                      )),
                const SizedBox(height: AppSpacing.xl),
                if (_submitError != null) ...[
                  ErrorBanner(message: _submitError!),
                  const SizedBox(height: AppSpacing.md),
                ],
                FilledButton(
                  onPressed: (_isSubmittingVerification || data.isEmpty) ? null : _submitVerification,
                  child: _isSubmittingVerification
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                      : Text(l10n.companySubmitVerification),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showAddDocumentSheet(BuildContext context) {
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
        child: _AddDocumentForm(companyId: widget.companyId),
      ),
    );
  }
}

class _AddDocumentForm extends ConsumerStatefulWidget {
  const _AddDocumentForm({required this.companyId});

  final String companyId;

  @override
  ConsumerState<_AddDocumentForm> createState() => _AddDocumentFormState();
}

class _AddDocumentFormState extends ConsumerState<_AddDocumentForm> {
  final _formKey = GlobalKey<FormState>();
  String? _type;
  String? _fileUrl;
  bool _fileMissing = false;
  bool _isSubmitting = false;
  String? _errorMessage;

  Future<void> _submit() async {
    final valid = _formKey.currentState!.validate();
    setState(() => _fileMissing = _fileUrl == null);
    if (_isSubmitting || !valid || _fileUrl == null) return;
    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    final l10n = AppLocalizations.of(context)!;
    final result = await ref.read(companyDocumentsControllerProvider(widget.companyId).notifier).addDocument(type: _type!, fileUrl: _fileUrl!);

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
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            DropdownButtonFormField<String>(
              initialValue: _type,
              isExpanded: true,
              decoration: InputDecoration(labelText: l10n.providerDocumentType),
              items: [
                for (final type in companyDocumentTypes) DropdownMenuItem(value: type, child: Text(documentTypeLabel(l10n, type))),
              ],
              onChanged: _isSubmitting ? null : (v) => setState(() => _type = v),
              validator: (v) => v == null ? l10n.validationRequired : null,
            ),
            const SizedBox(height: AppSpacing.md),
            ImageUploadField(
              purpose: MediaPurpose.document,
              label: l10n.documentPhoto,
              hint: l10n.documentPhotoHint,
              enabled: !_isSubmitting,
              aspectRatio: 3 / 2,
              errorText: _fileMissing ? l10n.mediaRequired : null,
              onChanged: (url) => setState(() {
                _fileUrl = url;
                _fileMissing = false;
              }),
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
                  : Text(l10n.companyAddDocument),
            ),
          ],
        ),
      ),
    );
  }
}
