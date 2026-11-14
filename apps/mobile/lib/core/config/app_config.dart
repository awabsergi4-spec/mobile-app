import 'package:flutter/foundation.dart';

/// Environment the app was built for — controls API base URL defaults and
/// how verbose logging is. Never inferred from `kDebugMode` alone: a
/// release build can still target staging.
enum AppEnvironment { development, staging, production }

/// All environment-configurable values in one place, resolved at compile
/// time via `--dart-define` (no extra package needed — `String.fromEnvironment`
/// is a Dart language feature). Nothing here is hardcoded into widgets;
/// every screen reads through `AppConfig`, never a literal URL.
///
/// By default every build talks to the deployed SAHL API on Render. To use
/// a backend running on this PC instead, pass `--dart-define=API_BASE_URL=...`:
///   Android emulator:        http://10.0.2.2:8000
///   USB phone (adb reverse): http://localhost:8000
///   Flutter web / desktop:   http://localhost:8000
abstract final class AppConfig {
  static const _envName = String.fromEnvironment('APP_ENV', defaultValue: 'development');

  static AppEnvironment get environment => switch (_envName) {
        'production' => AppEnvironment.production,
        'staging' => AppEnvironment.staging,
        _ => AppEnvironment.development,
      };

  static bool get isProduction => environment == AppEnvironment.production;

  static const _apiBaseUrlOverride = String.fromEnvironment('API_BASE_URL');

  /// The deployed SAHL API (apps/api, FastAPI on Render, backed by Neon).
  static const renderApiBaseUrl = 'https://mobile-app-ynec.onrender.com';

  static String get apiBaseUrl =>
      _apiBaseUrlOverride.isNotEmpty ? _apiBaseUrlOverride : renderApiBaseUrl;

  static const apiVersionPath = '/api/v1';

  static String get apiBaseUrlWithVersion => '$apiBaseUrl$apiVersionPath';

  /// Verbose request/response logging — enabled only for non-production
  /// debug builds, and even then the logging interceptor itself redacts
  /// sensitive fields (see core/networking/logging_interceptor.dart).
  static bool get verboseLogging => kDebugMode && !isProduction;

  static const connectTimeout = Duration(seconds: 15);
  static const receiveTimeout = Duration(seconds: 20);
}
