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
/// Local dev without any `--dart-define` still works: defaults point at
/// the backend's local dev port. Android emulators can't reach
/// `localhost` (it resolves to the emulator itself), so the default host
/// differs by platform — override with `--dart-define=API_BASE_URL=...`
/// for a physical device or a non-default backend host/port.
abstract final class AppConfig {
  static const _envName = String.fromEnvironment('APP_ENV', defaultValue: 'development');

  static AppEnvironment get environment => switch (_envName) {
        'production' => AppEnvironment.production,
        'staging' => AppEnvironment.staging,
        _ => AppEnvironment.development,
      };

  static bool get isProduction => environment == AppEnvironment.production;

  static const _apiBaseUrlOverride = String.fromEnvironment('API_BASE_URL');

  static String get apiBaseUrl {
    if (_apiBaseUrlOverride.isNotEmpty) return _apiBaseUrlOverride;
    // Web (incl. a phone browser): talk to the API on the page's own host.
    // Checked before the platform test because Flutter web reports Android
    // on Android browsers, where 10.0.2.2 would be wrong.
    if (kIsWeb) {
      return 'http://${Uri.base.host}:8000';
    }
    // The SAHL API (apps/api, FastAPI) listens on :8000. 10.0.2.2 is the
    // Android emulator's alias for the host machine's localhost — a
    // physical device needs --dart-define=API_BASE_URL=... (or
    // `adb reverse tcp:8000 tcp:8000` plus API_BASE_URL=http://localhost:8000).
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:8000';
    }
    return 'http://localhost:8000';
  }

  static const apiVersionPath = '/api/v1';

  static String get apiBaseUrlWithVersion => '$apiBaseUrl$apiVersionPath';

  /// Verbose request/response logging — enabled only for non-production
  /// debug builds, and even then the logging interceptor itself redacts
  /// sensitive fields (see core/networking/logging_interceptor.dart).
  static bool get verboseLogging => kDebugMode && !isProduction;

  static const connectTimeout = Duration(seconds: 15);
  static const receiveTimeout = Duration(seconds: 20);
}
