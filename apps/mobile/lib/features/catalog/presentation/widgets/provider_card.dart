import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../../../core/l10n/generated/app_localizations.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/utils/formatters.dart';
import '../../../../shared/widgets/sahl_ui.dart';
import '../../domain/catalog_models.dart';

/// List card for a provider (Explore, service details, search). Opens the
/// public provider profile.
class ProviderCard extends StatelessWidget {
  const ProviderCard({super.key, required this.provider, this.showPrice = false});

  final ProviderSummary provider;
  final bool showPrice;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final tokens = context.sahl;
    return SahlCard(
      onTap: () => context.push('/providers/${provider.id}'),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SahlAvatar(name: provider.businessName, imageUrl: provider.businessLogoUrl, size: 52),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        provider.businessName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
                      ),
                    ),
                    const SizedBox(width: 4),
                    Icon(Symbols.verified, size: 16, color: tokens.info, fill: 1, semanticLabel: l10n.verifiedProvider),
                  ],
                ),
                const SizedBox(height: 4),
                RatingStars(rating: provider.ratingAverage, count: provider.ratingCount, size: 14),
                if (provider.bio != null && provider.bio!.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(provider.bio!, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(color: tokens.textMuted)),
                ],
                const SizedBox(height: AppSpacing.sm),
                Wrap(
                  spacing: AppSpacing.sm,
                  runSpacing: AppSpacing.xs,
                  children: [
                    StatusChip(label: l10n.jobsDone(provider.completedJobsCount), icon: Symbols.task_alt),
                    if (showPrice) StatusChip(label: Fmt.priceRange(context, provider.priceMin, provider.priceMax), tone: StatusTone.brand),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Compact vertical card for horizontal carousels (Home "Top-rated").
class ProviderMiniCard extends StatelessWidget {
  const ProviderMiniCard({super.key, required this.provider});

  final ProviderSummary provider;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 150,
      child: SahlCard(
        onTap: () => context.push('/providers/${provider.id}'),
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SahlAvatar(name: provider.businessName, imageUrl: provider.businessLogoUrl, size: 48),
            const SizedBox(height: AppSpacing.md),
            Text(
              provider.businessName,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
            ),
            const Spacer(),
            RatingStars(rating: provider.ratingAverage, size: 13),
          ],
        ),
      ),
    );
  }
}
