import 'package:flutter/material.dart';

import 'app_colors.dart';
import 'app_radius.dart';
import 'app_spacing.dart';
import 'app_typography.dart';

/// success/warning/info/accent have no built-in ColorScheme role in
/// Material 3 — this extension adds them as first-class, theme-aware
/// colors. See docs/08-design-system.md §2 for why (vs. importing
/// AppColors constants directly into widgets).
@immutable
class SahlSemanticColors extends ThemeExtension<SahlSemanticColors> {
  const SahlSemanticColors({
    required this.success,
    required this.onSuccess,
    required this.warning,
    required this.onWarning,
    required this.info,
    required this.onInfo,
    required this.accent,
    required this.onAccent,
  });

  final Color success;
  final Color onSuccess;
  final Color warning;
  final Color onWarning;
  final Color info;
  final Color onInfo;
  final Color accent;
  final Color onAccent;

  // Same values in light/dark for now — the spec doesn't define separate
  // dark-mode semantic colors, and these mid-tone saturated hues read fine
  // against both AppColors.backgroundLight and backgroundDark.
  static const _shared = SahlSemanticColors(
    success: AppColors.success,
    onSuccess: Colors.white,
    warning: AppColors.warning,
    onWarning: Colors.black,
    info: AppColors.info,
    onInfo: Colors.white,
    accent: AppColors.accent,
    onAccent: Colors.black,
  );

  static const light = _shared;
  static const dark = _shared;

  @override
  SahlSemanticColors copyWith({
    Color? success,
    Color? onSuccess,
    Color? warning,
    Color? onWarning,
    Color? info,
    Color? onInfo,
    Color? accent,
    Color? onAccent,
  }) {
    return SahlSemanticColors(
      success: success ?? this.success,
      onSuccess: onSuccess ?? this.onSuccess,
      warning: warning ?? this.warning,
      onWarning: onWarning ?? this.onWarning,
      info: info ?? this.info,
      onInfo: onInfo ?? this.onInfo,
      accent: accent ?? this.accent,
      onAccent: onAccent ?? this.onAccent,
    );
  }

  @override
  SahlSemanticColors lerp(SahlSemanticColors? other, double t) {
    if (other is! SahlSemanticColors) return this;
    return SahlSemanticColors(
      success: Color.lerp(success, other.success, t)!,
      onSuccess: Color.lerp(onSuccess, other.onSuccess, t)!,
      warning: Color.lerp(warning, other.warning, t)!,
      onWarning: Color.lerp(onWarning, other.onWarning, t)!,
      info: Color.lerp(info, other.info, t)!,
      onInfo: Color.lerp(onInfo, other.onInfo, t)!,
      accent: Color.lerp(accent, other.accent, t)!,
      onAccent: Color.lerp(onAccent, other.onAccent, t)!,
    );
  }
}

/// SAHL brand theme — Material 3, exact palette + type scale from
/// docs/00-ui-ux-design-system.md, light + dark. See docs/08-design-system.md
/// for the engineering decisions behind each piece assembled here.
abstract final class AppTheme {
  static ThemeData light(Locale locale) => _build(Brightness.light, locale);
  static ThemeData dark(Locale locale) => _build(Brightness.dark, locale);

  static ThemeData _build(Brightness brightness, Locale locale) {
    final isLight = brightness == Brightness.light;

    final colorScheme = ColorScheme(
      brightness: brightness,
      primary: AppColors.primary,
      onPrimary: Colors.white,
      secondary: AppColors.secondary,
      onSecondary: Colors.white,
      tertiary: AppColors.accent,
      onTertiary: Colors.black,
      error: AppColors.error,
      onError: Colors.white,
      surface: isLight ? AppColors.surfaceLight : AppColors.surfaceDark,
      onSurface: isLight ? AppColors.textPrimary : Colors.white,
      surfaceContainerHighest: isLight
          ? const Color(0xFFF0F0F0)
          : const Color(0xFF2A2A2A),
      onSurfaceVariant: isLight ? AppColors.textSecondary : const Color(0xFFB0B0B0),
      outline: isLight ? AppColors.textDisabled : const Color(0xFF616161),
    );

    final baseTextTheme = isLight
        ? Typography.material2021().black
        : Typography.material2021().white;

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      brightness: brightness,
      scaffoldBackgroundColor: isLight ? AppColors.backgroundLight : AppColors.backgroundDark,
      textTheme: AppTypography.textTheme(locale, baseTextTheme),
      extensions: const [SahlSemanticColors.light],
      // Material 3 elevation system, clean floating surfaces — avoid heavy
      // shadows per docs/00-ui-ux-design-system.md §Elevation.
      appBarTheme: AppBarTheme(
        backgroundColor: colorScheme.surface,
        foregroundColor: colorScheme.onSurface,
        elevation: 0,
        centerTitle: true,
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(AppSpacing.huge), // >= 48dp touch target
          shape: RoundedRectangleBorder(borderRadius: AppRadius.buttonRadius),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size.fromHeight(AppSpacing.huge),
          shape: RoundedRectangleBorder(borderRadius: AppRadius.buttonRadius),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: colorScheme.surfaceContainerHighest.withValues(alpha: 0.4),
        border: OutlineInputBorder(
          borderRadius: AppRadius.searchFieldRadius,
          borderSide: BorderSide.none,
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.base,
          vertical: AppSpacing.md + 2,
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: AppRadius.cardRadius),
        color: colorScheme.surfaceContainer,
      ),
      dialogTheme: DialogThemeData(
        shape: RoundedRectangleBorder(borderRadius: AppRadius.dialogRadius),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        shape: RoundedRectangleBorder(borderRadius: AppRadius.bottomSheetRadius),
      ),
      // 48x48dp minimum touch target per docs/00-ui-ux-design-system.md
      // §Accessibility — Flutter's default, kept explicit rather than relying
      // on the framework default silently.
      materialTapTargetSize: MaterialTapTargetSize.padded,
    );
  }
}
