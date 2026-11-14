import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/sahl_ui.dart';

/// Customer › Requests tab: entry point to the customer's requests of each
/// service type and their disputes.
class CustomerRequestsScreen extends StatelessWidget {
  const CustomerRequestsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final tokens = context.sahl;
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.requestsTitle)),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.base),
        children: [
          ActionGroup(
            children: [
              ActionTile(
                icon: Symbols.bolt,
                color: colorScheme.primary,
                title: l10n.serviceTypeOnDemand,
                subtitle: l10n.requestsOnDemandSubtitle,
                onTap: () => context.push('/on-demand'),
              ),
              ActionTile(
                icon: Symbols.laptop_mac,
                color: tokens.info,
                title: l10n.serviceTypeShortTerm,
                subtitle: l10n.requestsShortTermSubtitle,
                onTap: () => context.push('/remote'),
              ),
              ActionTile(
                icon: Symbols.handshake,
                color: tokens.success,
                title: l10n.serviceTypeLongTerm,
                subtitle: l10n.requestsLongTermSubtitle,
                onTap: () => context.push('/contracts'),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          ActionGroup(
            children: [
              ActionTile(
                icon: Symbols.report,
                color: tokens.warning,
                title: l10n.disputeMyDisputes,
                subtitle: l10n.requestsDisputesSubtitle,
                onTap: () => context.push('/disputes'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
