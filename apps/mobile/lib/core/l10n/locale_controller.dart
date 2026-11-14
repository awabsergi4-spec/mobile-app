import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Supported locales — see docs/01-product-overview.md §1: Arabic (RTL) and
/// English (LTR), instant switch. RTL/LTR direction follows automatically
/// from the locale via Flutter's Directionality, not a separate flag.
const supportedLocales = [Locale('ar'), Locale('en')];

class LocaleController extends Notifier<Locale> {
  @override
  Locale build() => const Locale('ar');

  void setLocale(Locale locale) {
    assert(supportedLocales.contains(locale), 'Unsupported locale: $locale');
    state = locale;
  }
}

final localeControllerProvider = NotifierProvider<LocaleController, Locale>(
  LocaleController.new,
);
