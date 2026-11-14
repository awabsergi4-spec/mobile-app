import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../storage/local_cache.dart';

/// Supported locales — Arabic (RTL, default) and English (LTR). Direction
/// follows the locale automatically via Flutter's Directionality.
const supportedLocales = [Locale('ar'), Locale('en')];

const _localeKey = 'settings.locale';

/// Current UI language, persisted on the device so it survives restarts.
class LocaleController extends Notifier<Locale> {
  @override
  Locale build() {
    final saved = LocalCache.get<String>(_localeKey);
    return supportedLocales.firstWhere((l) => l.languageCode == saved, orElse: () => const Locale('ar'));
  }

  /// Whether the user has explicitly chosen a language on this device.
  bool get hasSavedChoice => LocalCache.get<String>(_localeKey) != null;

  void setLocale(Locale locale) {
    assert(supportedLocales.contains(locale), 'Unsupported locale: $locale');
    state = locale;
    LocalCache.put(_localeKey, locale.languageCode);
  }

  /// Applies the account's saved language after sign-in unless the user
  /// already picked one on this device.
  void applyAccountPreference(String languageCode) {
    if (hasSavedChoice) return;
    final match = supportedLocales.where((l) => l.languageCode == languageCode);
    if (match.isNotEmpty) state = match.first;
  }
}

final localeControllerProvider = NotifierProvider<LocaleController, Locale>(
  LocaleController.new,
);
