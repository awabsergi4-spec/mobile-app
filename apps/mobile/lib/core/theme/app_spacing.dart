/// 8px-grid spacing scale from docs/00-ui-ux-design-system.md §Spacing.
/// No theme-level indirection for this in Flutter — reference directly,
/// e.g. `padding: EdgeInsets.all(AppSpacing.base)`.
abstract final class AppSpacing {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double base = 16;
  static const double lg = 20;
  static const double xl = 24;
  static const double xxl = 32;
  static const double xxxl = 40;
  static const double huge = 48;
  static const double giant = 64;
}
