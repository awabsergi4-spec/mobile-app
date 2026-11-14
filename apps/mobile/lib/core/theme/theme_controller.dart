import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../storage/local_cache.dart';

const _themeKey = 'settings.theme_mode';

/// Light / Dark / System, persisted on the device.
class ThemeModeController extends Notifier<ThemeMode> {
  @override
  ThemeMode build() {
    return switch (LocalCache.get<String>(_themeKey)) {
      'light' => ThemeMode.light,
      'dark' => ThemeMode.dark,
      _ => ThemeMode.system,
    };
  }

  void setThemeMode(ThemeMode mode) {
    state = mode;
    LocalCache.put(_themeKey, mode.name);
  }
}

final themeModeControllerProvider = NotifierProvider<ThemeModeController, ThemeMode>(
  ThemeModeController.new,
);
