import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/utils/formatters.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/category_art.dart';
import '../../../shared/widgets/empty_state_view.dart';
import '../../../shared/widgets/sahl_ui.dart';
import '../application/catalog_providers.dart';
import '../domain/catalog_models.dart';
import '../../listings/presentation/widgets/listings_section.dart';

/// Public provider profile as customers see it: verification, experience,
/// rating, services with prices, portfolio and reviews, plus booking.
class ProviderProfilePublicScreen extends ConsumerWidget {
  const ProviderProfilePublicScreen({super.key, required this.providerId});

  final String providerId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final profile = ref.watch(providerProfileProvider(providerId));

    return Scaffold(
      appBar: AppBar(),
      body: AsyncValueView<ProviderPublicProfile>(
        value: profile,
        loading: const SkeletonList(itemCount: 4),
        onRetry: () => ref.invalidate(providerProfileProvider(providerId)),
        data: (context, p) {
          final tokens = context.sahl;
          final s = p.summary;
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(providerProfileProvider(providerId)),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(AppSpacing.base, 0, AppSpacing.base, 120),
              children: [
                Center(
                  child: SahlAvatar(name: s.businessName, imageUrl: s.businessLogoUrl ?? p.profilePictureUrl, size: 96),
                ),
                const SizedBox(height: AppSpacing.md),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Flexible(
                      child: Text(
                        s.businessName,
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Icon(Symbols.verified, color: tokens.info, fill: 1, semanticLabel: l10n.verifiedProvider),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  [p.ownerName, if (p.city != null && p.city!.isNotEmpty) p.city!].join(' · '),
                  textAlign: TextAlign.center,
                  style: TextStyle(color: tokens.textMuted),
                ),
                if (p.companyName != null) ...[
                  const SizedBox(height: AppSpacing.sm),
                  Center(
                    child: StatusChip(label: l10n.memberOfCompany(p.companyName!), icon: Symbols.apartment),
                  ),
                ],
                const SizedBox(height: AppSpacing.lg),
                Row(
                  children: [
                    Expanded(
                      child: StatTile(
                        icon: Symbols.star,
                        color: tokens.accent,
                        value: s.ratingAverage.toStringAsFixed(1),
                        label: l10n.reviewsCount(s.ratingCount),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: StatTile(
                        icon: Symbols.task_alt,
                        color: tokens.success,
                        value: '${s.completedJobsCount}',
                        label: l10n.providerStatCompleted,
                      ),
                    ),
                    if (s.yearsOfExperience != null) ...[
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: StatTile(
                          icon: Symbols.workspace_premium,
                          color: tokens.info,
                          value: '${s.yearsOfExperience}',
                          label: l10n.yearsExperience(s.yearsOfExperience!),
                        ),
                      ),
                    ],
                  ],
                ),
                if (s.bio != null && s.bio!.isNotEmpty) ...[
                  SectionHeader(title: l10n.aboutTitle),
                  SahlCard(child: Text(s.bio!, style: const TextStyle(height: 1.6))),
                ],
                if (s.skills.isNotEmpty) ...[
                  SectionHeader(title: l10n.skillsTitle),
                  Wrap(
                    spacing: AppSpacing.sm,
                    runSpacing: AppSpacing.sm,
                    children: [for (final skill in s.skills) Chip(label: Text(skill))],
                  ),
                ],
                ListingsSection(title: l10n.providerServicesListings, providerId: providerId, horizontal: true),
                SectionHeader(title: l10n.servicesOffered),
                if (p.services.isEmpty)
                  Text(l10n.serviceNoProviders, style: TextStyle(color: tokens.textMuted))
                else
                  ActionGroup(
                    children: [
                      for (final service in p.services)
                        ActionTile(
                          icon: switch (service.type) {
                            'REMOTE' => Symbols.laptop_mac,
                            'CONTRACT' => Symbols.handshake,
                            _ => Symbols.bolt,
                          },
                          color: switch (service.type) {
                            'REMOTE' => tokens.info,
                            'CONTRACT' => tokens.success,
                            _ => Theme.of(context).colorScheme.primary,
                          },
                          leading: ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: SizedBox.square(
                              dimension: 44,
                              child: CategoryArt(categoryKey: service.key, type: service.type, iconSize: 22),
                            ),
                          ),
                          title: service.name,
                          subtitle: Fmt.priceRange(context, service.priceMin, service.priceMax),
                          onTap: () => context.push('/services/${service.categoryId}'),
                        ),
                    ],
                  ),
                if (p.portfolio.isNotEmpty) ...[
                  SectionHeader(title: l10n.providerPortfolioTitle),
                  GridView.count(
                    crossAxisCount: 3,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: AppSpacing.sm,
                    crossAxisSpacing: AppSpacing.sm,
                    children: [
                      for (final item in p.portfolio)
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.network(
                            item.mediaUrl,
                            fit: BoxFit.cover,
                            semanticLabel: item.title,
                            errorBuilder: (_, _, _) => ColoredBox(
                              color: tokens.surfaceMuted,
                              child: Icon(Symbols.image, color: tokens.textMuted),
                            ),
                          ),
                        ),
                    ],
                  ),
                ],
                SectionHeader(
                  title: l10n.reviewsTitle,
                  actionLabel: p.recentReviews.isEmpty ? null : l10n.seeAll,
                  onAction: () => context.push('/providers/$providerId/reviews'),
                ),
                if (p.recentReviews.isEmpty)
                  Text(l10n.noReviewsYet, style: TextStyle(color: tokens.textMuted))
                else
                  for (final review in p.recentReviews) ...[ReviewTile(review: review), const SizedBox(height: AppSpacing.sm)],
              ],
            ),
          );
        },
      ),
      bottomNavigationBar: profile.valueOrNull == null ? null : _BookBar(profile: profile.value!),
    );
  }
}

class _BookBar extends StatelessWidget {
  const _BookBar({required this.profile});

  final ProviderPublicProfile profile;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    // Customers pick a provider directly only for short-term (remote) work;
    // on-demand jobs are matched automatically (see ServiceDetailsScreen).
    final remote = profile.services.where((s) => s.type == 'REMOTE').toList();
    if (remote.isEmpty) return const SizedBox.shrink();
    return SafeArea(
      minimum: const EdgeInsets.all(AppSpacing.base),
      child: FilledButton.icon(
        icon: const Icon(Symbols.event_available),
        label: Text(l10n.bookProviderAction),
        onPressed: () => context.push('/remote/new?providerId=${profile.summary.id}&categoryId=${remote.first.categoryId}'),
      ),
    );
  }
}

/// One review row (first name, stars, date, comment).
class ReviewTile extends StatelessWidget {
  const ReviewTile({super.key, required this.review});

  final ReviewEntry review;

  @override
  Widget build(BuildContext context) {
    final tokens = context.sahl;
    return SahlCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              SahlAvatar(name: review.authorName, size: 34),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(review.authorName, style: const TextStyle(fontWeight: FontWeight.w700)),
              ),
              if (review.createdAt != null)
                Text(Fmt.date(context, review.createdAt!), style: TextStyle(color: tokens.textMuted, fontSize: 12)),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          RatingStars(rating: review.rating.toDouble(), size: 15),
          if (review.comment != null && review.comment!.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(review.comment!, style: const TextStyle(height: 1.5)),
          ],
        ],
      ),
    );
  }
}

/// All reviews for a provider.
class ProviderReviewsScreen extends ConsumerWidget {
  const ProviderReviewsScreen({super.key, required this.providerId});

  final String providerId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final reviews = ref.watch(providerReviewsProvider(providerId));
    return Scaffold(
      appBar: AppBar(title: Text(l10n.reviewsTitle)),
      body: AsyncValueView<List<ReviewEntry>>(
        value: reviews,
        loading: const SkeletonList(),
        onRetry: () => ref.invalidate(providerReviewsProvider(providerId)),
        data: (context, items) => items.isEmpty
            ? EmptyStateView(icon: Symbols.reviews, message: l10n.noReviewsYet)
            : ListView.separated(
                padding: const EdgeInsets.all(AppSpacing.base),
                itemCount: items.length,
                separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
                itemBuilder: (_, i) => ReviewTile(review: items[i]),
              ),
      ),
    );
  }
}
