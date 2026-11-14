import 'package:flutter/material.dart';

/// Raw palette from docs/00-ui-ux-design-system.md §Color System.
/// Do not use these directly in widgets — go through `Theme.of(context)`
/// (colorScheme for primary/secondary/error, `SahlSemanticColors` extension
/// for success/warning/info/accent) so widgets stay theme-aware. See
/// docs/08-design-system.md §2.
abstract final class AppColors {
  static const primary = Color(0xFFF57C00);
  static const secondary = Color(0xFFE65100);
  static const accent = Color(0xFFFFB300);

  static const success = Color(0xFF2E7D32);
  static const warning = Color(0xFFF9A825);
  static const error = Color(0xFFD32F2F);
  static const info = Color(0xFF1976D2);

  static const backgroundLight = Color(0xFFFAFAFA);
  static const backgroundDark = Color(0xFF121212);
  static const surfaceLight = Color(0xFFFFFFFF);
  static const surfaceDark = Color(0xFF1E1E1E);

  static const textPrimary = Color(0xFF212121);
  static const textSecondary = Color(0xFF616161);
  static const textDisabled = Color(0xFF9E9E9E);
}
