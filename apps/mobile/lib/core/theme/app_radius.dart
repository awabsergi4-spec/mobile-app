import 'package:flutter/widgets.dart';

/// Border radius scale from docs/00-ui-ux-design-system.md §Border Radius.
/// Wired into component themes in app_theme.dart where possible; use
/// directly only for one-off custom shapes (e.g. image thumbnails).
abstract final class AppRadius {
  static const double card = 16;
  static const double dialog = 20;
  static const double button = 14;
  static const double bottomSheet = 24;
  static const double searchField = 16;
  static const double image = 12;

  static BorderRadius get cardRadius => BorderRadius.circular(card);
  static BorderRadius get dialogRadius => BorderRadius.circular(dialog);
  static BorderRadius get buttonRadius => BorderRadius.circular(button);
  static const bottomSheetRadius = BorderRadius.vertical(top: Radius.circular(bottomSheet));
  static BorderRadius get searchFieldRadius => BorderRadius.circular(searchField);
  static BorderRadius get imageRadius => BorderRadius.circular(image);
}
