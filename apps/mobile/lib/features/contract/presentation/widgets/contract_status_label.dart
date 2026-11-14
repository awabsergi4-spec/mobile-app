import 'package:flutter/material.dart';

import '../../../../core/l10n/generated/app_localizations.dart';
import '../../../../core/theme/app_theme.dart';
import '../../domain/contract_bid.dart';
import '../../domain/contract_project.dart';

String contractProjectStatusText(AppLocalizations l10n, ContractProjectStatus status) {
  return switch (status) {
    ContractProjectStatus.openForBids => l10n.contractStatusOpenForBids,
    ContractProjectStatus.awarded => l10n.contractStatusAwarded,
    ContractProjectStatus.cancelled => l10n.contractStatusCancelled,
  };
}

String contractBidStatusText(AppLocalizations l10n, ContractBidStatus status) {
  return switch (status) {
    ContractBidStatus.submitted => l10n.contractBidStatusSubmitted,
    ContractBidStatus.accepted => l10n.contractBidStatusAccepted,
    ContractBidStatus.rejected => l10n.contractBidStatusRejected,
    ContractBidStatus.withdrawn => l10n.contractBidStatusWithdrawn,
  };
}

Color contractProjectStatusColor(BuildContext context, ContractProjectStatus status) {
  final colorScheme = Theme.of(context).colorScheme;
  final semantic = Theme.of(context).extension<SahlSemanticColors>()!;
  return switch (status) {
    ContractProjectStatus.openForBids => semantic.info,
    ContractProjectStatus.awarded => semantic.success,
    ContractProjectStatus.cancelled => colorScheme.error,
  };
}

Color contractBidStatusColor(BuildContext context, ContractBidStatus status) {
  final colorScheme = Theme.of(context).colorScheme;
  final semantic = Theme.of(context).extension<SahlSemanticColors>()!;
  return switch (status) {
    ContractBidStatus.submitted => semantic.info,
    ContractBidStatus.accepted => semantic.success,
    ContractBidStatus.rejected || ContractBidStatus.withdrawn => colorScheme.error,
  };
}
