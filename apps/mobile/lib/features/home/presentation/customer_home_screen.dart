import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/remote_config/remote_config_providers.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/utils/formatters.dart';
import '../../../shared/widgets/sahl_ui.dart';
import '../../auth/application/auth_controller.dart';
import '../../catalog/application/catalog_providers.dart';
import '../../catalog/domain/catalog_models.dart';
import '../../catalog/presentation/widgets/provider_card.dart';
import '../../notification/presentation/widgets/notification_bell_button.dart';
import '../../on_demand/application/on_demand_controller.dart';
import '../../on_demand/domain/on_demand_request.dart';
import '../../on_demand/presentation/widgets/on_demand_status_label.dart';
import 'widgets/home_layout_block_list.dart';

/// Customer › Home tab: greeting, search, the active request (if any), the
/// three service types, live offers, top-rated providers and the
/// admin-published "For you" blocks.
class CustomerHomeScreen extends ConsumerWidget {
  const CustomerHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final user = ref.watch(authControllerProvider).user;

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(homeLayoutProvider);
            ref.invalidate(myOnDemandRequestsControllerProvider);
            ref.invalidate(activePromotionsProvider);
            ref.invalidate(recommendedProvidersProvider);
          },
          child: ListView(
            padding: const EdgeInsets.fromLTRB(AppSpacing.base, AppSpacing.md, AppSpacing.base, AppSpacing.xl),
            children: [
              Row(
                children: [
                  SahlAvatar(name: user?.fullName ?? '', imageUrl: user?.profilePictureUrl),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Text(
                      user != null ? l10n.homeGreeting(user.fullName) : l10n.homePlaceholderTitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                    ),
                  ),
                  const NotificationBellButton(),
                ],
              ),
              const SizedBox(height: AppSpacing.lg),
              SearchBarButton(hint: l10n.homeSearchHint, onTap: () => context.push('/search')),
              const _ActiveRequestSection(),
              SectionHeader(title: l10n.homeServiceTypesTitle),
              const _ServiceTypeCards(),
              const _PromotionsSection(),
              const _RecommendedSection(),
              const HomeLayoutBlockList(),
            ],
          ),
        ),
      ),
    );
  }
}

/// The three service types as illustrated cards: On-Demand as a wide hero,
/// Short-Term and Long-Term side by side. Each opens Explore on its tab.
class _ServiceTypeCards extends StatelessWidget {
  const _ServiceTypeCards();

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Column(
      children: [
        _HeroServiceCard(
          image: 'assets/images/ondemand.webp',
          title: l10n.serviceTypeOnDemand,
          hint: l10n.serviceTypeOnDemandHint,
          icon: Symbols.bolt,
          onTap: () => context.go('/c/explore?type=onDemand'),
        ),
        const SizedBox(height: AppSpacing.md),
        IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: _CompactServiceCard(
                  image: 'assets/images/short.webp',
                  title: l10n.serviceTypeShortTerm,
                  hint: l10n.serviceTypeShortTermHint,
                  icon: Symbols.laptop_mac,
                  onTap: () => context.go('/c/explore?type=remote'),
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: _CompactServiceCard(
                  image: 'assets/images/long.webp',
                  title: l10n.serviceTypeLongTerm,
                  hint: l10n.serviceTypeLongTermHint,
                  icon: Symbols.handshake,
                  onTap: () => context.go('/c/explore?type=contract'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// Decodes the large illustration at roughly the size it is shown.
Widget _serviceImage(BuildContext context, String asset, double logicalWidth) {
  final dpr = MediaQuery.devicePixelRatioOf(context);
  return Image.asset(
    asset,
    fit: BoxFit.cover,
    cacheWidth: (logicalWidth * dpr).round().clamp(200, 1672),
    excludeFromSemantics: true,
    errorBuilder: (_, _, _) => ColoredBox(color: context.sahl.surfaceMuted),
  );
}

class _HeroServiceCard extends StatelessWidget {
  const _HeroServiceCard({required this.image, required this.title, required this.hint, required this.icon, required this.onTap});

  final String image;
  final String title;
  final String hint;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final tokens = context.sahl;
    final rtl = Directionality.of(context) == TextDirection.rtl;
    return Semantics(
      button: true,
      label: '$title. $hint',
      excludeSemantics: true,
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          boxShadow: [BoxShadow(color: tokens.shadow, blurRadius: 18, offset: const Offset(0, 8))],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: AspectRatio(
            aspectRatio: 16 / 9,
            child: Stack(
              fit: StackFit.expand,
              children: [
                LayoutBuilder(builder: (context, c) => _serviceImage(context, image, c.maxWidth)),
                DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      stops: const [0.35, 1],
                      colors: [colorScheme.scrim.withValues(alpha: 0), colorScheme.scrim.withValues(alpha: 0.8)],
                    ),
                  ),
                ),
                PositionedDirectional(
                  start: AppSpacing.base,
                  end: AppSpacing.base,
                  bottom: AppSpacing.base,
                  child: DefaultTextStyle.merge(
                    style: const TextStyle(color: Colors.white),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Row(
                                children: [
                                  Icon(icon, color: colorScheme.primary, fill: 1, size: 22),
                                  const SizedBox(width: 6),
                                  Flexible(child: Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900))),
                                ],
                              ),
                              const SizedBox(height: 2),
                              Opacity(opacity: 0.88, child: Text(hint, maxLines: 2, overflow: TextOverflow.ellipsis)),
                            ],
                          ),
                        ),
                        const SizedBox(width: AppSpacing.md),
                        DecoratedBox(
                          decoration: BoxDecoration(color: colorScheme.primary, shape: BoxShape.circle),
                          child: Padding(
                            padding: const EdgeInsets.all(10),
                            child: Icon(rtl ? Symbols.arrow_back : Symbols.arrow_forward, color: colorScheme.onPrimary, size: 20),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                Material(type: MaterialType.transparency, child: InkWell(onTap: onTap)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _CompactServiceCard extends StatelessWidget {
  const _CompactServiceCard({required this.image, required this.title, required this.hint, required this.icon, required this.onTap});

  final String image;
  final String title;
  final String hint;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final tokens = context.sahl;
    final colorScheme = Theme.of(context).colorScheme;
    return Semantics(
      button: true,
      label: '$title. $hint',
      excludeSemantics: true,
      child: SahlCard(
        onTap: onTap,
        padding: EdgeInsets.zero,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AspectRatio(
              aspectRatio: 4 / 3,
              child: LayoutBuilder(builder: (context, c) => _serviceImage(context, image, c.maxWidth)),
            ),
            Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(icon, size: 18, color: colorScheme.primary),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(hint, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(color: tokens.textMuted, fontSize: 12)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Most recent on-demand request that's still running.
class _ActiveRequestSection extends ConsumerWidget {
  const _ActiveRequestSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final requests = ref.watch(myOnDemandRequestsControllerProvider).valueOrNull ?? const <OnDemandRequest>[];
    final active = requests.where((r) => r.status.isActive).toList()..sort((a, b) => b.createdAt.compareTo(a.createdAt));
    if (active.isEmpty) return const SizedBox.shrink();
    final request = active.first;
    final color = onDemandStatusColor(context, request.status);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SectionHeader(title: l10n.homeActiveRequest),
        SahlCard(
          onTap: () => context.push('/on-demand/${request.id}'),
          child: Row(
            children: [
              IconBadge(icon: Symbols.bolt, color: color),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(request.description, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text(
                      request.scheduledFor != null
                          ? l10n.scheduledFor(Fmt.dateTime(context, request.scheduledFor!))
                          : l10n.requestedOn(Fmt.dateTime(context, request.createdAt)),
                      style: TextStyle(color: context.sahl.textMuted, fontSize: 12),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Text(onDemandStatusText(l10n, request.status), style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 12)),
            ],
          ),
        ),
      ],
    );
  }
}

class _PromotionsSection extends ConsumerWidget {
  const _PromotionsSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final promos = ref.watch(activePromotionsProvider).valueOrNull ?? const <Promotion>[];
    if (promos.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SectionHeader(title: l10n.homePromotions),
        SizedBox(
          height: 132,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: promos.length,
            separatorBuilder: (_, _) => const SizedBox(width: AppSpacing.md),
            itemBuilder: (context, i) {
              final p = promos[i];
              final badge = p.discountType == 'PERCENTAGE'
                  ? l10n.promoPercentOff(p.discountValue)
                  : l10n.promoFlatOff(p.discountValue);
              final card = GradientCard(
                padding: const EdgeInsets.all(AppSpacing.base),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(badge, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
                    const SizedBox(height: 4),
                    Text(p.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700)),
                    if (p.description != null)
                      Opacity(
                        opacity: 0.8,
                        child: Text(p.description!, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12)),
                      ),
                  ],
                ),
              );
              return SizedBox(
                width: 260,
                child: p.categoryId == null
                    ? card
                    : GestureDetector(onTap: () => context.push('/services/${p.categoryId}'), child: card),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _RecommendedSection extends ConsumerWidget {
  const _RecommendedSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final providers = ref.watch(recommendedProvidersProvider).valueOrNull ?? const <ProviderSummary>[];
    if (providers.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SectionHeader(title: l10n.homeRecommended, actionLabel: l10n.seeAll, onAction: () => context.push('/search')),
        SizedBox(
          height: 160,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: providers.length,
            separatorBuilder: (_, _) => const SizedBox(width: AppSpacing.md),
            itemBuilder: (_, i) => ProviderMiniCard(provider: providers[i]),
          ),
        ),
      ],
    );
  }
}
