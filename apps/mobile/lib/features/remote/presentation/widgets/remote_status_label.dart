import 'package:flutter/material.dart';

import '../../../../core/l10n/generated/app_localizations.dart';
import '../../../../core/theme/app_theme.dart';
import '../../domain/remote_engagement.dart';

String remoteEngagementStatusText(AppLocalizations l10n, RemoteEngagementStatus status) {
  return switch (status) {
    RemoteEngagementStatus.active => l10n.remoteStatusActive,
    RemoteEngagementStatus.delivered => l10n.remoteStatusDelivered,
    RemoteEngagementStatus.completed => l10n.remoteStatusCompleted,
    RemoteEngagementStatus.cancelled => l10n.remoteStatusCancelled,
  };
}

Color remoteEngagementStatusColor(BuildContext context, RemoteEngagementStatus status) {
  final colorScheme = Theme.of(context).colorScheme;
  final semantic = Theme.of(context).extension<SahlSemanticColors>()!;
  return switch (status) {
    RemoteEngagementStatus.active => semantic.info,
    RemoteEngagementStatus.delivered => semantic.warning,
    RemoteEngagementStatus.completed => semantic.success,
    RemoteEngagementStatus.cancelled => colorScheme.error,
  };
}
