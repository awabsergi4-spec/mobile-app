import 'package:flutter/material.dart';

import 'app_colors.dart';
import 'app_radius.dart';
import 'app_spacing.dart';
import 'app_typography.dart';

/// Theme tokens Material 3's ColorScheme has no role for: status colors
/// (success/warning/info/accent) plus the SAHL brand surfaces used by cards,
/// tiles and headers. Widgets read these via
/// `Theme.of(context).extension<SahlSemanticColors>()!` (or `context.sahl`)
/// instead of importing AppColors, so every screen follows Light/Dark mode.
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
    required this.surfaceMuted,
    required this.border,
    required this.textMuted,
    required this.brandStart,
    required this.brandEnd,
    required this.shadow,
  });

  final Color success;
  final Color onSuccess;
  final Color warning;
  final Color onWarning;
  final Color info;
  final Color onInfo;
  final Color accent;
  final Color onAccent;

  /// Slightly raised background for tiles/inputs inside cards.
  final Color surfaceMuted;

  /// Hairline borders around cards and tiles.
  final Color border;

  /// Secondary/supporting text.
  final Color textMuted;

  /// Brand gradient (Sayer orange) used by primary call-to-action surfaces.
  final Color brandStart;
  final Color brandEnd;

  /// Soft shadow color for elevated cards.
  final Color shadow;

  LinearGradient get brandGradient => LinearGradient(
        colors: [brandStart, brandEnd],
        begin: AlignmentDirectional.topStart,
        end: AlignmentDirectional.bottomEnd,
      );

  static const light = SahlSemanticColors(
    success: AppColors.success,
    onSuccess: Colors.white,
    warning: Color(0xFFE09400),
    onWarning: Colors.black,
    info: AppColors.info,
    onInfo: Colors.white,
    accent: AppColors.accent,
    onAccent: Colors.black,
    surfaceMuted: Color(0xFFF4F4F6),
    border: Color(0xFFE6E6EA),
    textMuted: Color(0xFF6B6B73),
    brandStart: Color(0xFFFF9A1F),
    brandEnd: Color(0xFFFF5A00),
    shadow: Color(0x14000000),
  );

  static const dark = SahlSemanticColors(
    success: Color(0xFF4CAF50),
    onSuccess: Colors.white,
    warning: Color(0xFFFFB300),
    onWarning: Colors.black,
    info: Color(0xFF42A5F5),
    onInfo: Colors.black,
    accent: AppColors.accent,
    onAccent: Colors.black,
    surfaceMuted: Color(0xFF232327),
    border: Color(0xFF2E2E33),
    textMuted: Color(0xFFA6A6AE),
    brandStart: Color(0xFFFF9A1F),
    brandEnd: Color(0xFFFF5A00),
    shadow: Color(0x66000000),
  );

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
    Color? surfaceMuted,
    Color? border,
    Color? textMuted,
    Color? brandStart,
    Color? brandEnd,
    Color? shadow,
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
      surfaceMuted: surfaceMuted ?? this.surfaceMuted,
      border: border ?? this.border,
      textMuted: textMuted ?? this.textMuted,
      brandStart: brandStart ?? this.brandStart,
      brandEnd: brandEnd ?? this.brandEnd,
      shadow: shadow ?? this.shadow,
    );
  }

  @override
  SahlSemanticColors lerp(SahlSemanticColors? other, double t) {
    if (other is! SahlSemanticColors) return this;
    Color l(Color a, Color b) => Color.lerp(a, b, t)!;
    return SahlSemanticColors(
      success: l(success, other.success),
      onSuccess: l(onSuccess, other.onSuccess),
      warning: l(warning, other.warning),
      onWarning: l(onWarning, other.onWarning),
      info: l(info, other.info),
      onInfo: l(onInfo, other.onInfo),
      accent: l(accent, other.accent),
      onAccent: l(onAccent, other.onAccent),
      surfaceMuted: l(surfaceMuted, other.surfaceMuted),
      border: l(border, other.border),
      textMuted: l(textMuted, other.textMuted),
      brandStart: l(brandStart, other.brandStart),
      brandEnd: l(brandEnd, other.brandEnd),
      shadow: l(shadow, other.shadow),
    );
  }
}

extension SahlThemeContext on BuildContext {
  SahlSemanticColors get sahl => Theme.of(this).extension<SahlSemanticColors>()!;
}

/// SAHL brand theme — Material 3, Sayer orange on white (light) or deep
/// charcoal (dark). See docs/08-design-system.md.
abstract final class AppTheme {
  static ThemeData light(Locale locale) => _build(Brightness.light, locale);
  static ThemeData dark(Locale locale) => _build(Brightness.dark, locale);

  static ThemeData _build(Brightness brightness, Locale locale) {
    final isLight = brightness == Brightness.light;
    final tokens = isLight ? SahlSemanticColors.light : SahlSemanticColors.dark;

    final colorScheme = ColorScheme(
      brightness: brightness,
      primary: AppColors.primary,
      onPrimary: Colors.white,
      primaryContainer: isLight ? const Color(0xFFFFE6CC) : const Color(0xFF4A2A0A),
      onPrimaryContainer: isLight ? const Color(0xFF5A2E00) : const Color(0xFFFFD7AE),
      secondary: isLight ? const Color(0xFF2B2B30) : const Color(0xFFE6E6EA),
      onSecondary: isLight ? Colors.white : const Color(0xFF141416),
      tertiary: AppColors.accent,
      onTertiary: Colors.black,
      error: AppColors.error,
      onError: Colors.white,
      surface: isLight ? AppColors.surfaceLight : const Color(0xFF1A1A1D),
      onSurface: isLight ? AppColors.textPrimary : const Color(0xFFF2F2F4),
      surfaceContainerLowest: isLight ? Colors.white : const Color(0xFF111113),
      surfaceContainerLow: isLight ? const Color(0xFFFAFAFB) : const Color(0xFF17171A),
      surfaceContainer: isLight ? Colors.white : const Color(0xFF1C1C20),
      surfaceContainerHigh: isLight ? const Color(0xFFF1F1F4) : const Color(0xFF242428),
      surfaceContainerHighest: isLight ? const Color(0xFFEAEAEE) : const Color(0xFF2C2C31),
      onSurfaceVariant: tokens.textMuted,
      outline: isLight ? const Color(0xFFBDBDC4) : const Color(0xFF55555C),
      outlineVariant: tokens.border,
      shadow: Colors.black,
    );

    final baseTextTheme = isLight ? Typography.material2021().black : Typography.material2021().white;

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      brightness: brightness,
      scaffoldBackgroundColor: isLight ? const Color(0xFFF6F6F8) : const Color(0xFF0E0E10),
      textTheme: AppTypography.textTheme(locale, baseTextTheme),
      extensions: [tokens],
      appBarTheme: AppBarTheme(
        backgroundColor: isLight ? const Color(0xFFF6F6F8) : const Color(0xFF0E0E10),
        surfaceTintColor: Colors.transparent,
        foregroundColor: colorScheme.onSurface,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        centerTitle: true,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: colorScheme.surface,
        surfaceTintColor: Colors.transparent,
        indicatorColor: AppColors.primary.withValues(alpha: isLight ? 0.14 : 0.22),
        elevation: 0,
        height: 68,
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => TextStyle(
            fontSize: 12,
            fontWeight: states.contains(WidgetState.selected) ? FontWeight.w700 : FontWeight.w500,
            color: states.contains(WidgetState.selected) ? AppColors.primary : tokens.textMuted,
          ),
        ),
        iconTheme: WidgetStateProperty.resolveWith(
          (states) => IconThemeData(
            color: states.contains(WidgetState.selected) ? AppColors.primary : tokens.textMuted,
          ),
        ),
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
          side: BorderSide(color: tokens.border),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: tokens.surfaceMuted,
        border: OutlineInputBorder(borderRadius: AppRadius.searchFieldRadius, borderSide: BorderSide.none),
        contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.base, vertical: AppSpacing.md + 2),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: AppRadius.cardRadius,
          side: BorderSide(color: tokens.border),
        ),
        color: colorScheme.surfaceContainer,
      ),
      dividerTheme: DividerThemeData(color: tokens.border, space: 1, thickness: 1),
      segmentedButtonTheme: SegmentedButtonThemeData(
        style: SegmentedButton.styleFrom(
          selectedBackgroundColor: AppColors.primary.withValues(alpha: isLight ? 0.14 : 0.25),
          selectedForegroundColor: isLight ? const Color(0xFF7A3B00) : const Color(0xFFFFD7AE),
          side: BorderSide(color: tokens.border),
        ),
      ),
      dialogTheme: DialogThemeData(
        shape: RoundedRectangleBorder(borderRadius: AppRadius.dialogRadius),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        shape: RoundedRectangleBorder(borderRadius: AppRadius.bottomSheetRadius),
        showDragHandle: true,
      ),
      // 48x48dp minimum touch target per docs/00-ui-ux-design-system.md §Accessibility.
      materialTapTargetSize: MaterialTapTargetSize.padded,
    );
  }
}
