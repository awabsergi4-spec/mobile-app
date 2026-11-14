import 'package:flutter/material.dart';

import '../../../../core/l10n/generated/app_localizations.dart';
import '../../../../core/theme/app_theme.dart';
import '../../domain/company_document.dart';

String companyDocumentStatusText(AppLocalizations l10n, CompanyDocumentStatus status) {
  return switch (status) {
    CompanyDocumentStatus.pending => l10n.companyDocumentStatusPending,
    CompanyDocumentStatus.approved => l10n.companyDocumentStatusApproved,
    CompanyDocumentStatus.rejected => l10n.companyDocumentStatusRejected,
  };
}

Color companyDocumentStatusColor(BuildContext context, CompanyDocumentStatus status) {
  final colorScheme = Theme.of(context).colorScheme;
  final semantic = Theme.of(context).extension<SahlSemanticColors>()!;
  return switch (status) {
    CompanyDocumentStatus.pending => semantic.info,
    CompanyDocumentStatus.approved => semantic.success,
    CompanyDocumentStatus.rejected => colorScheme.error,
  };
}
