import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/category_art.dart';
import '../../../shared/widgets/empty_state_view.dart';
import '../../../shared/widgets/sahl_ui.dart';
import '../application/catalog_providers.dart';
import '../data/catalog_repository.dart';
import '../domain/catalog_models.dart';
import 'widgets/provider_card.dart';

/// Search across services and providers (`GET /search`). With an empty
/// query it lists top-rated providers.
class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _controller = TextEditingController();
  Timer? _debounce;
  String _query = '';

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _onChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () {
      if (mounted) setState(() => _query = value.trim());
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: TextField(
          controller: _controller,
          autofocus: true,
          textInputAction: TextInputAction.search,
          onChanged: _onChanged,
          onSubmitted: (v) => setState(() => _query = v.trim()),
          decoration: InputDecoration(
            hintText: l10n.homeSearchHint,
            border: InputBorder.none,
            enabledBorder: InputBorder.none,
            focusedBorder: InputBorder.none,
            filled: false,
            suffixIcon: _controller.text.isEmpty
                ? null
                : IconButton(
                    tooltip: MaterialLocalizations.of(context).deleteButtonTooltip,
                    icon: const Icon(Symbols.close),
                    onPressed: () {
                      _controller.clear();
                      setState(() => _query = '');
                    },
                  ),
          ),
        ),
      ),
      body: _query.length < 2 ? const _TopProviders() : _Results(query: _query),
    );
  }
}

class _TopProviders extends ConsumerWidget {
  const _TopProviders();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    const query = (categoryId: null, query: null, sort: ProviderSort.rating, remoteOnly: false) as ProviderQuery;
    final providers = ref.watch(exploreProvidersProvider(query));
    return AsyncValueView<List<ProviderSummary>>(
      value: providers,
      loading: const SkeletonList(),
      onRetry: () => ref.invalidate(exploreProvidersProvider(query)),
      data: (context, items) => ListView(
        padding: const EdgeInsets.all(AppSpacing.base),
        children: [
          SectionHeader(title: l10n.homeRecommended),
          if (items.isEmpty) EmptyStateView(icon: Symbols.engineering, message: l10n.requestsEmpty),
          for (final p in items) ...[ProviderCard(provider: p), const SizedBox(height: AppSpacing.md)],
        ],
      ),
    );
  }
}

class _Results extends ConsumerWidget {
  const _Results({required this.query});

  final String query;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final results = ref.watch(searchProvider(query));
    final tokens = context.sahl;
    return AsyncValueView<SearchResults>(
      value: results,
      loading: const SkeletonList(),
      onRetry: () => ref.invalidate(searchProvider(query)),
      data: (context, r) {
        if (r.categories.isEmpty && r.providers.isEmpty) {
          return EmptyStateView(icon: Symbols.search_off, message: l10n.searchNoResults(query));
        }
        return ListView(
          padding: const EdgeInsets.all(AppSpacing.base),
          children: [
            if (r.categories.isNotEmpty) ...[
              SectionHeader(title: l10n.searchCategories),
              ActionGroup(
                children: [
                  for (final c in r.categories)
                    ActionTile(
                      icon: switch (c.type) {
                        'REMOTE' => Symbols.laptop_mac,
                        'CONTRACT' => Symbols.handshake,
                        _ => Symbols.bolt,
                      },
                      color: switch (c.type) {
                        'REMOTE' => tokens.info,
                        'CONTRACT' => tokens.success,
                        _ => Theme.of(context).colorScheme.primary,
                      },
                      leading: ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: SizedBox.square(
                          dimension: 44,
                          child: CategoryArt(categoryKey: c.key, imageUrl: c.imageUrl, type: c.type, iconSize: 22),
                        ),
                      ),
                      title: c.name,
                      subtitle: switch (c.type) {
                        'REMOTE' => l10n.serviceTypeShortTerm,
                        'CONTRACT' => l10n.serviceTypeLongTerm,
                        _ => l10n.serviceTypeOnDemand,
                      },
                      onTap: () => context.push('/services/${c.id}'),
                    ),
                ],
              ),
            ],
            if (r.providers.isNotEmpty) ...[
              SectionHeader(title: l10n.searchProviders),
              for (final p in r.providers) ...[ProviderCard(provider: p), const SizedBox(height: AppSpacing.md)],
            ],
          ],
        );
      },
    );
  }
}
