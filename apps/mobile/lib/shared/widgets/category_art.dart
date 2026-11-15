import 'package:flutter/material.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../core/theme/app_theme.dart';
import '../../features/listings/domain/listing_models.dart';

/// Bundled artwork for service categories, matched on the category's
/// locale-independent `key` (its English name as a slug, from the API).
/// Matching on a keyword keeps it working if an admin renames a category
/// ("Electrical" → "Electrical repairs").
const _artByKeyword = [
  ('tow', 'towing'),
  ('plumb', 'plumbing'),
  ('electr', 'electricty'),
  ('construct', 'constructions'),
  ('legal', 'legal'),
  ('program', 'programming'),
  ('develop', 'programming'),
  ('design', 'desgin'),
  ('voice', 'voice'),
  ('dubb', 'voice'),
  ('writ', 'writing'),
  ('translat', 'writing'),
  ('video', 'video'),
  ('montage', 'video'),
];

String? categoryImageAsset(String? key) {
  if (key == null || key.isEmpty) return null;
  for (final (keyword, file) in _artByKeyword) {
    if (key.contains(keyword)) return 'assets/images/$file.webp';
  }
  return null;
}

/// Icon and color for a service type (`ON_DEMAND` | `REMOTE` | `CONTRACT`).
(IconData, Color) serviceTypeStyle(BuildContext context, String type) => switch (type) {
      'REMOTE' => (Symbols.laptop_mac, context.sahl.info),
      'CONTRACT' => (Symbols.handshake, context.sahl.success),
      _ => (Symbols.bolt, Theme.of(context).colorScheme.primary),
    };

/// A category's picture filling its box (cover). Falls back to the service
/// type's icon on a tinted background when there's no artwork for it.
class CategoryArt extends StatelessWidget {
  const CategoryArt({super.key, required this.categoryKey, required this.type, this.imageUrl, this.iconSize = 32});

  final String? categoryKey;

  /// Admin-uploaded picture; shown first, bundled art is the fallback.
  final String? imageUrl;
  final String type;
  final double iconSize;

  @override
  Widget build(BuildContext context) {
    final (icon, color) = serviceTypeStyle(context, type);
    final fallback = ColoredBox(
      color: color.withValues(alpha: 0.12),
      child: Center(child: Icon(icon, color: color, size: iconSize)),
    );
    final asset = categoryImageAsset(categoryKey);
    final bundled = asset == null ? fallback : null;
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth.isFinite ? constraints.maxWidth : 400.0;
        final px = (width * MediaQuery.devicePixelRatioOf(context)).round().clamp(120, 1600);
        final local = bundled ??
            Image.asset(
              asset!,
              fit: BoxFit.cover,
              cacheWidth: px,
              excludeFromSemantics: true,
              errorBuilder: (_, _, _) => fallback,
            );
        if (imageUrl == null || imageUrl!.isEmpty) return local;
        return Image.network(
          cloudinaryVariant(imageUrl!, width: px),
          fit: BoxFit.cover,
          excludeFromSemantics: true,
          loadingBuilder: (context, child, progress) => progress == null ? child : local,
          errorBuilder: (_, _, _) => local,
        );
      },
    );
  }
}
