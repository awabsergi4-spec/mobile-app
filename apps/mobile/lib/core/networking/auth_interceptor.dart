import 'dart:async';

import 'package:dio/dio.dart';

import '../config/app_config.dart';
import '../storage/secure_token_storage.dart';

/// Extra-options key: requests that must not carry a bearer token or
/// trigger a refresh-on-401 (login, register, refresh itself) set
/// this so the interceptor leaves them alone.
const skipAuthExtraKey = 'skipAuth';
const _isRetryExtraKey = 'isRetry';

/// Attaches the current access token to every request that wants one, and
/// on a 401 attempts exactly one silent refresh-and-retry before giving up
/// and reporting the session as expired. Concurrent 401s share a single
/// in-flight refresh (via `_refreshCompleter`) rather than each firing
/// their own `/auth/refresh` call — a burst of parallel requests hitting
/// an expired token must not race the server into rotating the refresh
/// token multiple times (RefreshSessionUseCase revokes-on-reuse, so a
/// second concurrent refresh call with the same token would look like
/// theft and log the user out for real).
class AuthInterceptor extends Interceptor {
  AuthInterceptor({
    required this.tokenStorage,
    required this.dio,
    required this.onSessionExpired,
  });

  final SecureTokenStorage tokenStorage;
  final Dio dio;
  final Future<void> Function() onSessionExpired;

  Completer<bool>? _refreshCompleter;

  @override
  Future<void> onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    if (options.extra[skipAuthExtraKey] != true) {
      final token = await tokenStorage.readAccessToken();
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    }
    handler.next(options);
  }

  @override
  Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
    final requestOptions = err.requestOptions;
    final shouldAttemptRefresh = err.response?.statusCode == 401 &&
        requestOptions.extra[skipAuthExtraKey] != true &&
        requestOptions.extra[_isRetryExtraKey] != true;

    if (!shouldAttemptRefresh) {
      handler.next(err);
      return;
    }

    final refreshed = await _refreshOnce();
    if (!refreshed) {
      await onSessionExpired();
      handler.next(err);
      return;
    }

    try {
      final token = await tokenStorage.readAccessToken();
      final retryOptions = requestOptions.copyWith(
        extra: {...requestOptions.extra, _isRetryExtraKey: true},
      );
      if (token != null) {
        retryOptions.headers = {...retryOptions.headers, 'Authorization': 'Bearer $token'};
      }
      final response = await dio.fetch<dynamic>(retryOptions);
      handler.resolve(response);
    } on DioException catch (retryError) {
      handler.next(retryError);
    }
  }

  Future<bool> _refreshOnce() async {
    final inFlight = _refreshCompleter;
    if (inFlight != null) {
      return inFlight.future;
    }

    final completer = Completer<bool>();
    _refreshCompleter = completer;

    try {
      final refreshToken = await tokenStorage.readRefreshToken();
      if (refreshToken == null) {
        completer.complete(false);
        return false;
      }

      // A bare Dio instance, not `this.dio` — calling /auth/refresh through
      // the same interceptor chain would recurse into this exact method on
      // its own 401.
      final refreshDio = Dio(BaseOptions(
        baseUrl: AppConfig.apiBaseUrlWithVersion,
        connectTimeout: AppConfig.connectTimeout,
        receiveTimeout: AppConfig.receiveTimeout,
      ));
      final response = await refreshDio.post<Map<String, dynamic>>(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
      );
      final data = response.data?['data'] as Map<String, dynamic>?;
      final accessToken = data?['accessToken'] as String?;
      final newRefreshToken = data?['refreshToken'] as String?;
      if (accessToken == null || newRefreshToken == null) {
        completer.complete(false);
        return false;
      }

      await tokenStorage.saveSession(accessToken: accessToken, refreshToken: newRefreshToken);
      completer.complete(true);
      return true;
    } catch (_) {
      await tokenStorage.clear();
      completer.complete(false);
      return false;
    } finally {
      _refreshCompleter = null;
    }
  }
}
