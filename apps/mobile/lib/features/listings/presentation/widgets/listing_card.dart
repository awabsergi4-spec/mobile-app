import 'package:flutter/material.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../../../core/l10n/generated/app_localizations.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/utils/formatters.dart';
import '../../../../shared/widgets/sahl_ui.dart';
import '../../domain/listing_models.dart';

/// A listing's cover at 16:9, always filled (never stretched or letterboxed).
class ListingCover extends StatelessWidget {
  const ListingCover({super.key, required this.url, this.width = 800, this.borderRadius});

  final String url;
  final int width;
  final BorderRadius? borderRadius;

  @override
  Widget build(BuildContext context) {
    final tokens = context.sahl;
    final image = AspectRatio(
      aspectRatio: 16 / 9,
      child: Image.network(
        cloudinaryVariant(url, width: width),
        fit: BoxFit.cover,
        excludeFromSemantics: true,
        loadingBuilder: (context, child, progress) => progress == null ? child : ColoredBox(color: tokens.surfaceMuted),
        errorBuilder: (_, _, _) => ColoredBox(
          color: tokens.surfaceMuted,
          child: Center(child: Icon(Symbols.image, color: tokens.textMuted)),
        ),
      ),
    );
    return borderRadius == null ? image : ClipRRect(borderRadius: borderRadius!, child: image);
  }
}

(String, StatusTone) listingStatusLabel(AppLocalizations l10n, ListingStatus s) => switch (s) {
      ListingStatus.pendingReview => (l10n.listingStatusPending, StatusTone.warning),
      ListingStatus.published => (l10n.listingStatusPublished, StatusTone.success),
      ListingStatus.rejected => (l10n.listingStatusRejected, StatusTone.danger),
      ListingStatus.paused => (l10n.listingStatusPaused, StatusTone.neutral),
    };

/// Grid/list card: cover, title, provider with rating, "From price".
/// [showStatus] is for the provider's own list.
class ListingCard extends StatelessWidget {
  const ListingCard({super.key, required this.listing, required this.onTap, this.showStatus = false, this.trailing});

  final ServiceListing listing;
  final VoidCallback onTap;
  final bool showStatus;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final tokens = context.sahl;
    final provider = listing.provider;
    return Semantics(
      button: true,
      label: '${listing.title}. ${l10n.priceFrom(Fmt.number(context, listing.priceFrom))}',
      child: SahlCard(
        onTap: onTap,
        padding: EdgeInsets.zero,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Stack(
              children: [
                ListingCover(url: listing.coverUrl, width: 640),
                if (showStatus)
                  PositionedDirectional(
                    top: AppSpacing.sm,
                    start: AppSpacing.sm,
                    child: Builder(builder: (context) {
                      final (label, tone) = listingStatusLabel(l10n, listing.status);
                      return DecoratedBox(
                        decoration: BoxDecoration(color: Theme.of(context).colorScheme.surface, borderRadius: BorderRadius.circular(20)),
                        child: StatusChip(label: label, tone: tone),
                      );
                    }),
                  ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    listing.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800, height: 1.3),
                  ),
                  if (provider != null) ...[
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        SahlAvatar(name: provider.businessName, imageUrl: provider.businessLogoUrl, size: 22),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(provider.businessName,
                              maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: tokens.textMuted, fontSize: 12)),
                        ),
                        Icon(Symbols.star, size: 14, fill: 1, color: tokens.accent),
                        const SizedBox(width: 2),
                        Text(provider.ratingAverage.toStringAsFixed(1), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                      ],
                    ),
                  ],
                  const SizedBox(height: AppSpacing.sm),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          l10n.priceFrom(Fmt.number(context, listing.priceFrom)),
                          style: TextStyle(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.w800),
                        ),
                      ),
                      if (trailing != null) trailing!,
                    ],
                  ),
                  if (showStatus && listing.status == ListingStatus.rejected && listing.rejectionReason != null) ...[
                    const SizedBox(height: AppSpacing.sm),
                    Text(
                      l10n.listingRejectedReason(listing.rejectionReason!),
                      style: TextStyle(color: Theme.of(context).colorScheme.error, fontSize: 12),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
