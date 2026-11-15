import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_spacing.dart';
import '../../../../shared/widgets/sahl_ui.dart';
import '../../application/listing_providers.dart';
import '../../domain/listing_models.dart';
import 'listing_card.dart';

/// Published listings for a category (vertical) or a provider (horizontal
/// carousel). Renders nothing when there are none, so screens can always
/// include it.
class ListingsSection extends ConsumerWidget {
  const ListingsSection({super.key, required this.title, this.categoryId, this.providerId, this.horizontal = false});

  final String title;
  final String? categoryId;
  final String? providerId;
  final bool horizontal;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final query = (categoryId: categoryId, providerId: providerId);
    final items = ref.watch(listingsProvider(query)).valueOrNull ?? const <ServiceListing>[];
    if (items.isEmpty) return const SizedBox.shrink();
    void open(ServiceListing l) => context.push('/listings/${l.id}');
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SectionHeader(title: title),
        if (horizontal)
          SizedBox(
            height: 290,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: items.length,
              separatorBuilder: (_, _) => const SizedBox(width: AppSpacing.md),
              itemBuilder: (_, i) => SizedBox(width: 260, child: ListingCard(listing: items[i], onTap: () => open(items[i]))),
            ),
          )
        else
          for (final l in items) ...[ListingCard(listing: l, onTap: () => open(l)), const SizedBox(height: AppSpacing.md)],
      ],
    );
  }
}
