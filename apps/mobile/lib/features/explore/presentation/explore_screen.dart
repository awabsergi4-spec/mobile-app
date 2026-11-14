import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/category_art.dart';
import '../../../shared/widgets/empty_state_view.dart';
import '../../../shared/widgets/sahl_ui.dart';
import '../../service_category/application/service_category_controller.dart';
import '../../service_category/domain/service_category.dart';

/// Customer › Explore tab: real service categories for the three service
/// types (On-Demand / Short-Term = Remote / Long-Term = Contract). Picking a
/// category opens its service details.
class ExploreScreen extends StatelessWidget {
  const ExploreScreen({super.key, this.initialType});

  /// `onDemand` | `remote` | `contract` (from `?type=`), defaults to On-Demand.
  final String? initialType;

  static const _order = [ServiceType.onDemand, ServiceType.remote, ServiceType.contract];

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final initialIndex = _order.indexWhere((t) => t.name == initialType).clamp(0, 2);

    return DefaultTabController(
      key: ValueKey(initialType),
      length: _order.length,
      initialIndex: initialIndex,
      child: Scaffold(
        appBar: AppBar(
          title: Text(l10n.exploreTitle),
          actions: [
            IconButton(
              tooltip: l10n.homeSearchHint,
              icon: const Icon(Symbols.search),
              onPressed: () => context.push('/search'),
            ),
          ],
          bottom: TabBar(
            tabs: [
              Tab(text: l10n.serviceTypeOnDemand),
              Tab(text: l10n.serviceTypeShortTerm),
              Tab(text: l10n.serviceTypeLongTerm),
            ],
          ),
        ),
        body: TabBarView(children: [for (final type in _order) _CategoryGrid(type: type)]),
      ),
    );
  }
}

class _CategoryGrid extends ConsumerWidget {
  const _CategoryGrid({required this.type});

  final ServiceType type;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final categories = ref.watch(serviceCategoriesProvider(type));

    return AsyncValueView<List<ServiceCategory>>(
      value: categories,
      loading: const SkeletonList(itemCount: 4),
      onRetry: () => ref.invalidate(serviceCategoriesProvider(type)),
      data: (context, items) {
        if (items.isEmpty) {
          return EmptyStateView(icon: Symbols.category, message: l10n.exploreEmpty);
        }
        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(serviceCategoriesProvider(type)),
          child: GridView.builder(
            padding: const EdgeInsets.all(AppSpacing.base),
            gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
              maxCrossAxisExtent: 220,
              mainAxisExtent: 196,
              crossAxisSpacing: AppSpacing.md,
              mainAxisSpacing: AppSpacing.md,
            ),
            itemCount: items.length,
            itemBuilder: (context, index) {
              final category = items[index];
              return Semantics(
                button: true,
                label: category.name,
                excludeSemantics: true,
                child: SahlCard(
                  onTap: () => context.push('/services/${category.id}'),
                  padding: EdgeInsets.zero,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Expanded(child: CategoryArt(categoryKey: category.key, type: type.wireValue)),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.sm, AppSpacing.md, AppSpacing.md),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              category.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              l10n.exploreRequestAction,
                              style: TextStyle(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.w700, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}
