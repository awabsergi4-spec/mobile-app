/// Mirrors HomeBlockType in apps/backend/prisma/schema.prisma — kept as a
/// string, not a Dart enum, deliberately: a backend-introduced block type
/// this client doesn't know about yet must be skippable, not a parse
/// failure. See docs/02-architecture.md ADR-007 "Consequence for the
/// mobile app".
class HomeLayoutBlock {
  const HomeLayoutBlock({
    required this.id,
    required this.type,
    required this.position,
    required this.config,
    required this.isVisible,
  });

  factory HomeLayoutBlock.fromJson(Map<String, dynamic> json) {
    return HomeLayoutBlock(
      id: json['id'] as String,
      type: json['type'] as String,
      position: json['position'] as int,
      config: json['config'] as Map<String, dynamic>? ?? const {},
      isVisible: json['isVisible'] as bool? ?? true,
    );
  }

  final String id;
  final String type;
  final int position;
  final Map<String, dynamic> config;
  final bool isVisible;
}

/// Block types this build of the app knows how to render. A type absent
/// from this set — because the backend shipped a new block type between
/// app releases, or it's CUSTOM_HTML on a platform that can't render raw
/// HTML natively — is skipped by the home screen, not a crash. This set is
/// the only thing that grows when a genuinely new client-side rendering
/// capability is added; everything else about a block (content, targeting,
/// scheduling, visibility) is backend-driven.
const supportedHomeBlockTypes = <String>{
  'HERO_BANNER',
  'IMAGE_SLIDER',
  'CATEGORIES',
  'FEATURED_CATEGORIES',
  'FEATURED_PROVIDERS',
  'FEATURED_SERVICES',
  'EMERGENCY_SERVICES',
  'NEARBY_SERVICES',
  'RECOMMENDED_SERVICES',
  'RECENTLY_VIEWED',
  'TRENDING_SERVICES',
  'PROMOTIONS',
  'ADVERTISEMENTS',
  'SEASONAL_CAMPAIGN',
  'NEWS',
  // CUSTOM_HTML intentionally excluded — web only, see ADR-007.
};
