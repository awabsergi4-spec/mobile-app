import 'package:flutter/widgets.dart';
import 'package:intl/intl.dart';

import '../../core/l10n/generated/app_localizations.dart';

/// Locale-aware date/time and price formatting used across screens.
abstract final class Fmt {
  static String _locale(BuildContext context) => Localizations.localeOf(context).languageCode;

  static String date(BuildContext context, DateTime value) =>
      DateFormat.yMMMd(_locale(context)).format(value.toLocal());

  static String dateTime(BuildContext context, DateTime value) =>
      DateFormat.yMMMd(_locale(context)).add_jm().format(value.toLocal());

  static String number(BuildContext context, int value) => NumberFormat.decimalPattern(_locale(context)).format(value);

  /// "From 5,000" / "5,000 – 15,000" / "Price on request" for a price range.
  static String priceRange(BuildContext context, int? min, int? max) {
    final l10n = AppLocalizations.of(context)!;
    if (min != null && max != null && min != max) return l10n.priceRange(number(context, min), number(context, max));
    final single = min ?? max;
    if (single != null) return l10n.priceFrom(number(context, single));
    return l10n.priceOnRequest;
  }
}
