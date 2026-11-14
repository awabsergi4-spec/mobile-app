import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../../../core/l10n/generated/app_localizations.dart';
import '../../../../core/remote_config/home_layout_block.dart';
import '../../../../core/remote_config/remote_config_providers.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../shared/widgets/async_value_view.dart';
import '../../../../shared/widgets/empty_state_view.dart';

const _blockIcons = <String, IconData>{
  'HERO_BANNER': Symbols.campaign,
  'IMAGE_SLIDER': Symbols.image,
  'CATEGORIES': Symbols.category,
  'FEATURED_CATEGORIES': Symbols.category,
  'FEATURED_PROVIDERS': Symbols.star,
  'FEATURED_SERVICES': Symbols.star,
  'EMERGENCY_SERVICES': Symbols.emergency,
  'NEARBY_SERVICES': Symbols.near_me,
  'RECOMMENDED_SERVICES': Symbols.recommend,
  'RECENTLY_VIEWED': Symbols.history,
  'TRENDING_SERVICES': Symbols.trending_up,
  'PROMOTIONS': Symbols.local_offer,
  'ADVERTISEMENTS': Symbols.ads_click,
  'SEASONAL_CAMPAIGN': Symbols.celebration,
  'NEWS': Symbols.newspaper,
};

/// Renders the admin-authored, targeting-filtered home layout
/// (ADR-007 Dynamic Home Builder) — block *ordering*, *visibility*, and
/// *presence* are entirely backend-driven; only the per-type visual
/// treatment lives here. A block whose content (categories, providers,
/// services, ...) doesn't have a dedicated browse screen yet renders as a
/// labeled placeholder card rather than being skipped — real, backend-
/// authored content, just not richly laid out until that screen exists.
class HomeLayoutBlockList extends ConsumerWidget {
  const HomeLayoutBlockList({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final layout = ref.watch(homeLayoutProvider);

    return AsyncValueView<List<HomeLayoutBlock>>(
      value: layout,
      onRetry: () => ref.invalidate(homeLayoutProvider),
      data: (context, blocks) {
        if (blocks.isEmpty) {
          return EmptyStateView(message: l10n.homeNoContent);
        }
        return ListView.separated(
          padding: const EdgeInsets.all(AppSpacing.base),
          itemCount: blocks.length,
          separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.md),
          itemBuilder: (context, index) => _BlockCard(block: blocks[index]),
        );
      },
    );
  }
}

class _BlockCard extends StatelessWidget {
  const _BlockCard({required this.block});

  final HomeLayoutBlock block;

  @override
  Widget build(BuildContext context) {
    final title = block.config['title'] as String? ?? block.type.replaceAll('_', ' ').toLowerCase();
    return Card(
      child: ListTile(
        leading: Icon(_blockIcons[block.type] ?? Symbols.widgets),
        title: Text(title),
      ),
    );
  }
}
