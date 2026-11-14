import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/sahl_ui.dart';

/// Provider › Jobs tab: offers and work across the three service types.
class ProviderJobsScreen extends StatelessWidget {
  const ProviderJobsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final tokens = context.sahl;
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.jobsTitle)),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.base),
        children: [
          ActionGroup(
            children: [
              ActionTile(
                icon: Symbols.bolt,
                color: colorScheme.primary,
                title: l10n.onDemandJobOffers,
                subtitle: l10n.jobsOffersSubtitle,
                onTap: () => context.push('/on-demand/offers'),
              ),
              ActionTile(
                icon: Symbols.laptop_mac,
                color: tokens.info,
                title: l10n.remoteMyBookings,
                subtitle: l10n.jobsBookingsSubtitle,
                onTap: () => context.push('/remote/bookings'),
              ),
              ActionTile(
                icon: Symbols.gavel,
                color: tokens.success,
                title: l10n.contractMyBids,
                subtitle: l10n.jobsBidsSubtitle,
                onTap: () => context.push('/contracts/my-bids'),
              ),
              ActionTile(
                icon: Symbols.travel_explore,
                color: tokens.warning,
                title: l10n.contractBrowseProjects,
                subtitle: l10n.jobsBrowseSubtitle,
                onTap: () => context.push('/contracts/browse'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Provider › Services tab: what customers see about this provider.
class ProviderServicesScreen extends StatelessWidget {
  const ProviderServicesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final tokens = context.sahl;
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.servicesTitle)),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.base),
        children: [
          ActionGroup(
            children: [
              ActionTile(
                icon: Symbols.badge,
                color: colorScheme.primary,
                title: l10n.providerProfileTitle,
                subtitle: l10n.servicesProfileSubtitle,
                onTap: () => context.push('/provider/profile'),
              ),
              ActionTile(
                icon: Symbols.photo_library,
                color: tokens.info,
                title: l10n.providerPortfolioTitle,
                subtitle: l10n.servicesPortfolioSubtitle,
                onTap: () => context.push('/provider/portfolio'),
              ),
              ActionTile(
                icon: Symbols.verified_user,
                color: tokens.success,
                title: l10n.providerDocumentsTitle,
                subtitle: l10n.servicesVerificationSubtitle,
                onTap: () => context.push('/provider/verification'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
