import 'package:dio/dio.dart';

import '../errors/app_failure.dart';

/// Turns whatever Dio threw into one AppFailure — the only place in the
/// app that inspects a DioException/raw response shape directly. Every
/// repository downstream only ever sees AppFailure.
AppFailure mapDioExceptionToFailure(DioException error) {
  switch (error.type) {
    case DioExceptionType.connectionTimeout:
    case DioExceptionType.sendTimeout:
    case DioExceptionType.receiveTimeout:
    case DioExceptionType.transformTimeout:
      return const NetworkFailure(isTimeout: true);
    case DioExceptionType.connectionError:
      return const NetworkFailure(isTimeout: false);
    case DioExceptionType.cancel:
      return UnknownFailure(error);
    case DioExceptionType.badCertificate:
      return UnknownFailure(error);
    case DioExceptionType.badResponse:
      return _mapBadResponse(error);
    case DioExceptionType.unknown:
      // Dio classifies a raw SocketException (device genuinely offline)
      // as `unknown`, not `connectionError`, on some platforms.
      return const NetworkFailure(isTimeout: false);
  }
}

AppFailure _mapBadResponse(DioException error) {
  final statusCode = error.response?.statusCode ?? 0;
  final body = error.response?.data;

  // A 401 normally means "session gone" — except a wrong password at login,
  // which must surface as "incorrect phone or password".
  final isInvalidCredentials = body is Map<String, dynamic> && body['errorCode'] == 'INVALID_CREDENTIALS';
  if (statusCode == 401 && !isInvalidCredentials) {
    return const UnauthorizedFailure();
  }

  if (body is Map<String, dynamic> && body['success'] == false) {
    final errorCode = body['errorCode'] as String?;
    final message = body['message'] as String?;
    if (errorCode != null) {
      return ApiFailure(
        statusCode: statusCode,
        errorCode: errorCode,
        backendMessage: message ?? '',
        details: body['details'] as Map<String, dynamic>?,
        traceId: body['traceId'] as String?,
      );
    }
  }

  if (statusCode >= 500) {
    return ServerFailure(statusCode: statusCode);
  }

  return ServerFailure(statusCode: statusCode);
}
