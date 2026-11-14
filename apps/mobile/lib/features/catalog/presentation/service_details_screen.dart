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
import '../data/catalog_repository.dart';
import '../domain/catalog_models.dart';
import 'widgets/provider_card.dart';

/// A service (category): what it is, its price range, who offers it, and
/// the right next step for its type — on-demand requests are matched
/// automatically, short-term work is booked with a chosen provider, and
/// long-term work starts with a posted project.
class ServiceDetailsScreen extends ConsumerStatefulWidget {
  const ServiceDetailsScreen({super.key, required this.categoryId});

  final String categoryId;

  @override
  ConsumerState<ServiceDetailsScreen> createState() => _ServiceDetailsScreenState();
}

class _ServiceDetailsScreenState extends ConsumerState<ServiceDetailsScreen> {
  ProviderSort _sort = ProviderSort.rating;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final detail = ref.watch(categoryDetailProvider(widget.categoryId));

    return Scaffold(
      appBar: AppBar(title: Text(detail.valueOrNull?.name ?? '')),
      body: AsyncValueView<CategoryDetail>(
        value: detail,
        loading: const SkeletonList(itemCount: 4),
        onRetry: () => ref.invalidate(categoryDetailProvider(widget.categoryId)),
        data: (context, category) {
          final query = (categoryId: category.id, query: null, sort: _sort, remoteOnly: false) as ProviderQuery;
          final providers = ref.watch(exploreProvidersProvider(query));
          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(categoryDetailProvider(widget.categoryId));
              ref.invalidate(exploreProvidersProvider(query));
            },
            child: ListView(
              padding: const EdgeInsets.fromLTRB(AppSpacing.base, AppSpacing.sm, AppSpacing.base, 120),
              children: [
                _Header(category: category),
                SectionHeader(title: l10n.serviceProvidersTitle),
                Wrap(
                  spacing: AppSpacing.sm,
                  children: [
                    for (final (sort, label) in [
                      (ProviderSort.rating, l10n.sortRating),
                      (ProviderSort.jobs, l10n.sortJobs),
                      (ProviderSort.newest, l10n.sortNewest),
                    ])
                      ChoiceChip(label: Text(label), selected: _sort == sort, onSelected: (_) => setState(() => _sort = sort)),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                providers.when(
                  loading: () => const SizedBox(height: 240, child: SkeletonList(itemCount: 2)),
                  error: (_, _) => const SizedBox.shrink(),
                  data: (items) => items.isEmpty
                      ? EmptyStateView(icon: Symbols.engineering, message: l10n.serviceNoProviders)
                      : Column(
                          children: [
                            for (final p in items) ...[ProviderCard(provider: p, showPrice: true), const SizedBox(height: AppSpacing.md)],
                          ],
                        ),
                ),
              ],
            ),
          );
        },
      ),
      bottomNavigationBar: detail.valueOrNull == null ? null : _ActionBar(category: detail.value!),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.category});

  final CategoryDetail category;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final tokens = context.sahl;
    final (icon, color, typeLabel) = switch (category.type) {
      'REMOTE' => (Symbols.laptop_mac, tokens.info, l10n.serviceTypeShortTerm),
      'CONTRACT' => (Symbols.handshake, tokens.success, l10n.serviceTypeLongTerm),
      _ => (Symbols.bolt, Theme.of(context).colorScheme.primary, l10n.serviceTypeOnDemand),
    };
    return SahlCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AspectRatio(
            aspectRatio: 16 / 9,
            child: CategoryArt(categoryKey: category.key, type: category.type, iconSize: 56),
          ),
          Padding(
            padding: const EdgeInsets.all(AppSpacing.base),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    IconBadge(icon: icon, color: color),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(category.name, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
                          const SizedBox(height: 4),
                          StatusChip(label: typeLabel, tone: StatusTone.brand),
                        ],
                      ),
                    ),
                  ],
                ),
                if (category.description != null && category.description!.isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.md),
                  Text(category.description!, style: TextStyle(color: tokens.textMuted, height: 1.5)),
                ],
                const SizedBox(height: AppSpacing.md),
                Wrap(
                  spacing: AppSpacing.sm,
                  runSpacing: AppSpacing.sm,
                  children: [
                    StatusChip(
                      label: Fmt.priceRange(context, category.priceMin, category.priceMax),
                      icon: Symbols.sell,
                      tone: StatusTone.success,
                    ),
                    StatusChip(label: l10n.serviceProvidersCount(category.providerCount), icon: Symbols.groups),
                  ],
                ),
                if (category.type == 'ON_DEMAND' || category.type == 'REMOTE') ...[
                  const SizedBox(height: AppSpacing.md),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Symbols.info, size: 18, color: tokens.info),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: Text(
                          category.type == 'ON_DEMAND' ? l10n.onDemandMatchingNote : l10n.remotePickProviderNote,
                          style: TextStyle(color: tokens.textMuted, fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionBar extends StatelessWidget {
  const _ActionBar({required this.category});

  final CategoryDetail category;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    // Short-term (remote) work is booked from a chosen provider's profile,
    // so there's no category-level action for it.
    final (label, route) = switch (category.type) {
      'ON_DEMAND' => (l10n.requestServiceAction, '/book?categoryId=${category.id}'),
      'CONTRACT' => (l10n.postProjectAction, '/contracts/new?categoryId=${category.id}'),
      _ => (null, null),
    };
    if (label == null) return const SizedBox.shrink();
    return SafeArea(
      minimum: const EdgeInsets.all(AppSpacing.base),
      child: FilledButton.icon(onPressed: () => context.push(route!), icon: const Icon(Symbols.arrow_forward), label: Text(label)),
    );
  }
}
