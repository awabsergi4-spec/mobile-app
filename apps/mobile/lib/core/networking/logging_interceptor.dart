import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

/// Request/response fields that must never reach the console, even in
/// development builds — passwords, OTP codes, tokens, and anything
/// payment-secret-shaped.
const _redactedFields = {
  'password',
  'code',
  'otp',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'cardnumber',
  'cvv',
  'gatewayref',
};

/// Development-only, sensitive-field-redacting request logger. Never
/// installed on the Dio instance when `AppConfig.verboseLogging` is false
/// (see ApiClient) — this file existing doesn't mean logging is active.
class LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    debugPrint('→ ${options.method} ${options.uri}');
    if (options.data != null) {
      debugPrint('  body: ${_redact(options.data)}');
    }
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    debugPrint('← ${response.statusCode} ${response.requestOptions.uri}');
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    debugPrint('✕ ${err.response?.statusCode} ${err.requestOptions.uri}: ${err.message}');
    handler.next(err);
  }

  Object? _redact(Object? data) {
    if (data is Map) {
      return data.map((key, value) {
        final isSensitive = _redactedFields.contains(key.toString().toLowerCase());
        return MapEntry(key, isSensitive ? '••••••' : _redact(value));
      });
    }
    if (data is List) {
      return data.map(_redact).toList();
    }
    return data;
  }
}
