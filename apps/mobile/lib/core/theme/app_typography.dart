import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Locale-aware type scale per docs/00-ui-ux-design-system.md §Typography:
/// Inter for English, IBM Plex Sans Arabic for Arabic (Cairo is the spec's
/// named alternative — not wired as an automatic fallback here; revisit if
/// IBM Plex Sans Arabic turns out to have glyph coverage gaps in practice).
/// "Typography must automatically switch according to language" — driven by
/// the app's active Locale, not per-widget choice.
abstract final class AppTypography {
  static TextTheme textTheme(Locale locale, TextTheme base) {
    return locale.languageCode == 'ar'
        ? GoogleFonts.ibmPlexSansArabicTextTheme(base)
        : GoogleFonts.interTextTheme(base);
  }
}
