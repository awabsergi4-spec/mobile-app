import 'package:flutter/material.dart';

import '../../../../core/l10n/generated/app_localizations.dart';
import '../../../../core/theme/app_theme.dart';
import '../../domain/withdrawal.dart';

String withdrawalStatusText(AppLocalizations l10n, WithdrawalStatus status) {
  return switch (status) {
    WithdrawalStatus.requested => l10n.withdrawalStatusRequested,
    WithdrawalStatus.pendingApproval => l10n.withdrawalStatusPendingApproval,
    WithdrawalStatus.approved => l10n.withdrawalStatusApproved,
    WithdrawalStatus.rejected => l10n.withdrawalStatusRejected,
    WithdrawalStatus.processing => l10n.withdrawalStatusProcessing,
    WithdrawalStatus.paid => l10n.withdrawalStatusPaid,
    WithdrawalStatus.failed => l10n.withdrawalStatusFailed,
  };
}

Color withdrawalStatusColor(BuildContext context, WithdrawalStatus status) {
  final colorScheme = Theme.of(context).colorScheme;
  final semantic = Theme.of(context).extension<SahlSemanticColors>()!;
  return switch (status) {
    WithdrawalStatus.requested || WithdrawalStatus.pendingApproval || WithdrawalStatus.processing => semantic.info,
    WithdrawalStatus.approved || WithdrawalStatus.paid => semantic.success,
    WithdrawalStatus.rejected || WithdrawalStatus.failed => colorScheme.error,
  };
}
