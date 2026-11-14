import 'package:flutter/material.dart';

import '../../../../core/l10n/generated/app_localizations.dart';
import '../../../../core/theme/app_theme.dart';
import '../../domain/provider_document.dart';

String providerDocumentStatusText(AppLocalizations l10n, ProviderDocumentStatus status) {
  return switch (status) {
    ProviderDocumentStatus.pending => l10n.providerDocumentStatusPending,
    ProviderDocumentStatus.approved => l10n.providerDocumentStatusApproved,
    ProviderDocumentStatus.rejected => l10n.providerDocumentStatusRejected,
  };
}

Color providerDocumentStatusColor(BuildContext context, ProviderDocumentStatus status) {
  final colorScheme = Theme.of(context).colorScheme;
  final semantic = Theme.of(context).extension<SahlSemanticColors>()!;
  return switch (status) {
    ProviderDocumentStatus.pending => semantic.info,
    ProviderDocumentStatus.approved => semantic.success,
    ProviderDocumentStatus.rejected => colorScheme.error,
  };
}
