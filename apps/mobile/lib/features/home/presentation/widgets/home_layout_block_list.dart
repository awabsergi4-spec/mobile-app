import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../../../core/l10n/generated/app_localizations.dart';
import '../../../../core/remote_config/home_layout_block.dart';
import '../../../../core/remote_config/remote_config_providers.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../shared/widgets/sahl_ui.dart';

const _blockIcons = <String, IconData>{
  'HERO_BANNER': Symbols.campaign,
  'IMAGE_SLIDER': Symbols.view_carousel,
  'CATEGORIES': Symbols.category,
  'FEATURED_CATEGORIES': Symbols.category,
  'FEATURED_PROVIDERS': Symbols.engineering,
  'FEATURED_SERVICES': Symbols.home_repair_service,
  'EMERGENCY_SERVICES': Symbols.emergency,
  'NEARBY_SERVICES': Symbols.near_me,
  'RECOMMENDED_SERVICES': Symbols.recommend,
  'RECENTLY_VIEWED': Symbols.history,
  'TRENDING_SERVICES': Symbols.trending_up,
  'PROMOTIONS': Symbols.sell,
  'ADVERTISEMENTS': Symbols.ads_click,
  'SEASONAL_CAMPAIGN': Symbols.celebration,
  'NEWS': Symbols.newspaper,
};

/// The admin-authored, targeting-filtered home layout (Dynamic Home Builder)
/// as an embeddable section of the customer Home tab. Ordering, visibility
/// and presence are backend-driven. Optional content: when there are no
/// published blocks (or they fail to load) the section renders nothing, so
/// it never blocks or clutters the rest of Home.
class HomeLayoutBlockList extends ConsumerWidget {
  const HomeLayoutBlockList({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final blocks = ref.watch(homeLayoutProvider).valueOrNull ?? const <HomeLayoutBlock>[];
    if (blocks.isEmpty) return const SizedBox.shrink();

    final colorScheme = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SectionHeader(title: l10n.homeForYou),
        for (final block in blocks) ...[
          SahlCard(
            child: Row(
              children: [
                IconBadge(icon: _blockIcons[block.type] ?? Symbols.widgets, color: colorScheme.primary),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Text(
                    block.config['title'] as String? ?? block.type.replaceAll('_', ' ').toLowerCase(),
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
        ],
      ],
    );
  }
}
