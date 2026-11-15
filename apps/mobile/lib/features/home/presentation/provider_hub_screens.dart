import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/errors/failure_localizer.dart';
import '../../../core/utils/result.dart';
import '../../../shared/widgets/empty_state_view.dart';
import '../../../shared/widgets/sahl_ui.dart';
import '../../listings/application/listing_providers.dart';
import '../../listings/domain/listing_models.dart';
import '../../listings/presentation/widgets/listing_card.dart';

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
class ProviderServicesScreen extends ConsumerWidget {
  const ProviderServicesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final tokens = context.sahl;
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.servicesTitle)),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/provider/listings/new'),
        icon: const Icon(Symbols.add),
        label: Text(l10n.postServiceAction),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(myListingsProvider),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(AppSpacing.base, AppSpacing.base, AppSpacing.base, 96),
          children: [
            const _MyListingsSection(),
            SectionHeader(title: l10n.accountSection),
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
      ),
    );
  }
}

class _MyListingsSection extends ConsumerWidget {
  const _MyListingsSection();

  Future<void> _run(BuildContext context, WidgetRef ref, Future<Result<void>> Function() action) async {
    final l10n = AppLocalizations.of(context)!;
    final result = await action();
    if (!context.mounted) return;
    if (result case Failure(:final failure)) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(localizeFailure(l10n, failure))));
    }
    ref.invalidate(myListingsProvider);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final listings = ref.watch(myListingsProvider);
    final repo = ref.read(listingRepositoryProvider);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SectionHeader(title: l10n.myListingsTitle),
        listings.when(
          loading: () => const SizedBox(height: 220, child: SkeletonList(itemCount: 1)),
          error: (error, _) => const SizedBox.shrink(),
          data: (items) => items.isEmpty
              ? EmptyStateView(icon: Symbols.storefront, message: l10n.myListingsEmpty)
              : Column(
                  children: [
                    for (final listing in items) ...[
                      ListingCard(
                        listing: listing,
                        showStatus: true,
                        onTap: () => context.push('/provider/listings/${listing.id}/edit'),
                        trailing: PopupMenuButton<String>(
                          tooltip: MaterialLocalizations.of(context).showMenuTooltip,
                          onSelected: (action) async {
                            switch (action) {
                              case 'edit':
                                context.push('/provider/listings/${listing.id}/edit');
                              case 'pause':
                                await _run(context, ref, () => repo.pause(listing.id));
                              case 'resume':
                                await _run(context, ref, () => repo.resume(listing.id));
                              case 'delete':
                                final ok = await showConfirmDialog(
                                  context,
                                  title: l10n.listingDeleteConfirm,
                                  message: l10n.listingDeleteMessage,
                                  confirmLabel: l10n.listingDelete,
                                  destructive: true,
                                );
                                if (ok && context.mounted) await _run(context, ref, () => repo.delete(listing.id));
                            }
                          },
                          itemBuilder: (context) => [
                            PopupMenuItem(value: 'edit', child: Text(l10n.listingEdit)),
                            if (listing.status == ListingStatus.published) PopupMenuItem(value: 'pause', child: Text(l10n.listingPause)),
                            if (listing.status == ListingStatus.paused) PopupMenuItem(value: 'resume', child: Text(l10n.listingResume)),
                            PopupMenuItem(value: 'delete', child: Text(l10n.listingDelete)),
                          ],
                        ),
                      ),
                      const SizedBox(height: AppSpacing.md),
                    ],
                  ],
                ),
        ),
      ],
    );
  }
}
