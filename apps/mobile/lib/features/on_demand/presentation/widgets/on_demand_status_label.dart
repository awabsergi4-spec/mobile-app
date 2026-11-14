import 'package:flutter/material.dart';

import '../../../../core/l10n/generated/app_localizations.dart';
import '../../../../core/theme/app_theme.dart';
import '../../domain/on_demand_request.dart';

String onDemandStatusText(AppLocalizations l10n, OnDemandStatus status) {
  return switch (status) {
    OnDemandStatus.searching => l10n.requestStatusSearching,
    OnDemandStatus.assigned => l10n.requestStatusAssigned,
    OnDemandStatus.enRoute => l10n.requestStatusEnRoute,
    OnDemandStatus.inProgress => l10n.requestStatusInProgress,
    OnDemandStatus.completed => l10n.requestStatusCompleted,
    OnDemandStatus.cancelled => l10n.requestStatusCancelled,
  };
}

Color onDemandStatusColor(BuildContext context, OnDemandStatus status) {
  final colorScheme = Theme.of(context).colorScheme;
  final semantic = Theme.of(context).extension<SahlSemanticColors>()!;
  return switch (status) {
    OnDemandStatus.searching => semantic.info,
    OnDemandStatus.assigned || OnDemandStatus.enRoute || OnDemandStatus.inProgress => semantic.warning,
    OnDemandStatus.completed => semantic.success,
    OnDemandStatus.cancelled => colorScheme.error,
  };
}
