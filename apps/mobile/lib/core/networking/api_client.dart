import 'package:dio/dio.dart';

import '../config/app_config.dart';
import '../storage/secure_token_storage.dart';
import 'api_response.dart';
import 'app_failure_exception.dart';
import 'auth_interceptor.dart';
import 'failure_mapper.dart';
import 'logging_interceptor.dart';

/// The single Dio-backed HTTP client for the whole app. Every repository
/// goes through this — none construct their own Dio instance — so base
/// URL, auth, retry-on-401, envelope parsing, and error normalization are
/// each implemented exactly once.
class ApiClient {
  ApiClient({required SecureTokenStorage tokenStorage, Future<void> Function()? onSessionExpired})
      : _tokenStorage = tokenStorage,
        _dio = Dio(BaseOptions(
          baseUrl: AppConfig.apiBaseUrlWithVersion,
          connectTimeout: AppConfig.connectTimeout,
          receiveTimeout: AppConfig.receiveTimeout,
          headers: {'Content-Type': 'application/json'},
        )) {
    _dio.interceptors.add(AuthInterceptor(
      tokenStorage: _tokenStorage,
      dio: _dio,
      onSessionExpired: onSessionExpired ?? () async {},
    ));

    if (AppConfig.verboseLogging) {
      _dio.interceptors.add(LoggingInterceptor());
    }
  }

  final SecureTokenStorage _tokenStorage;
  final Dio _dio;

  /// Escape hatch for the rare caller that needs the raw Dio instance
  /// (e.g. a multipart upload progress callback) — everything else should
  /// use get/post/patch/delete below.
  Dio get dio => _dio;

  Future<ApiResponseEnvelope> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    bool skipAuth = false,
  }) =>
      _request('GET', path, queryParameters: queryParameters, skipAuth: skipAuth);

  Future<ApiResponseEnvelope> post(
    String path, {
    Object? data,
    Map<String, dynamic>? queryParameters,
    bool skipAuth = false,
  }) =>
      _request('POST', path, data: data, queryParameters: queryParameters, skipAuth: skipAuth);

  Future<ApiResponseEnvelope> patch(
    String path, {
    Object? data,
    bool skipAuth = false,
  }) =>
      _request('PATCH', path, data: data, skipAuth: skipAuth);

  Future<ApiResponseEnvelope> put(
    String path, {
    Object? data,
    bool skipAuth = false,
  }) =>
      _request('PUT', path, data: data, skipAuth: skipAuth);

  Future<ApiResponseEnvelope> delete(
    String path, {
    Object? data,
    bool skipAuth = false,
  }) =>
      _request('DELETE', path, data: data, skipAuth: skipAuth);

  Future<ApiResponseEnvelope> _request(
    String method,
    String path, {
    Object? data,
    Map<String, dynamic>? queryParameters,
    bool skipAuth = false,
  }) async {
    try {
      final response = await _dio.request<Map<String, dynamic>>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: Options(method: method, extra: {skipAuthExtraKey: skipAuth}),
      );
      final body = response.data ?? const {};
      return ApiResponseEnvelope(
        data: body['data'],
        message: body['message'] as String?,
        pagination: body['pagination'] as Map<String, dynamic>?,
        metadata: body['metadata'] as Map<String, dynamic>?,
      );
    } on DioException catch (error) {
      throw AppFailureException(mapDioExceptionToFailure(error));
    }
  }
}
