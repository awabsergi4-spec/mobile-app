import 'package:flutter/material.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../core/theme/app_theme.dart';

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
  const CategoryArt({super.key, required this.categoryKey, required this.type, this.iconSize = 32});

  final String? categoryKey;
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
    if (asset == null) return fallback;
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth.isFinite ? constraints.maxWidth : 400.0;
        return Image.asset(
          asset,
          fit: BoxFit.cover,
          // The source files are large; decode at roughly the shown size.
          cacheWidth: (width * MediaQuery.devicePixelRatioOf(context)).round().clamp(120, 1600),
          excludeFromSemantics: true,
          errorBuilder: (_, _, _) => fallback,
        );
      },
    );
  }
}
