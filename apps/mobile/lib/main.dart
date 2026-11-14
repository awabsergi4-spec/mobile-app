import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app/app.dart';
import 'core/storage/local_cache.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Settings (theme, language) and cached reference data live here. A
  // failure only means "nothing persisted" — never block app start.
  try {
    await LocalCache.init();
  } catch (_) {}
  runApp(const ProviderScope(child: SahlApp()));
}
