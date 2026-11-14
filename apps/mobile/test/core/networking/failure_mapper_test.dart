import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sahl_mobile/core/errors/app_failure.dart';
import 'package:sahl_mobile/core/networking/failure_mapper.dart';

RequestOptions _options() => RequestOptions(path: '/test');

void main() {
  group('mapDioExceptionToFailure', () {
    test('timeout types map to NetworkFailure(isTimeout: true)', () {
      final failure = mapDioExceptionToFailure(
        DioException(requestOptions: _options(), type: DioExceptionType.connectionTimeout),
      );
      expect(failure, isA<NetworkFailure>());
      expect((failure as NetworkFailure).isTimeout, isTrue);
    });

    test('connectionError maps to NetworkFailure(isTimeout: false)', () {
      final failure = mapDioExceptionToFailure(
        DioException(requestOptions: _options(), type: DioExceptionType.connectionError),
      );
      expect(failure, isA<NetworkFailure>());
      expect((failure as NetworkFailure).isTimeout, isFalse);
    });

    test('401 response maps to UnauthorizedFailure', () {
      final failure = mapDioExceptionToFailure(
        DioException(
          requestOptions: _options(),
          type: DioExceptionType.badResponse,
          response: Response(requestOptions: _options(), statusCode: 401),
        ),
      );
      expect(failure, isA<UnauthorizedFailure>());
    });

    test('401 INVALID_CREDENTIALS (wrong password at login) stays a specific ApiFailure', () {
      final failure = mapDioExceptionToFailure(
        DioException(
          requestOptions: _options(),
          type: DioExceptionType.badResponse,
          response: Response(
            requestOptions: _options(),
            statusCode: 401,
            data: {'success': false, 'errorCode': 'INVALID_CREDENTIALS', 'message': 'Invalid phone or password'},
          ),
        ),
      );
      expect(failure, isA<ApiFailure>());
      expect((failure as ApiFailure).errorCode, 'INVALID_CREDENTIALS');
    });

    test('a backend error envelope maps to ApiFailure carrying errorCode/traceId', () {
      final failure = mapDioExceptionToFailure(
        DioException(
          requestOptions: _options(),
          type: DioExceptionType.badResponse,
          response: Response(
            requestOptions: _options(),
            statusCode: 409,
            data: {
              'success': false,
              'errorCode': 'PHONE_ALREADY_REGISTERED',
              'message': 'An account with this phone already exists',
              'traceId': 'trace-123',
            },
          ),
        ),
      );
      expect(failure, isA<ApiFailure>());
      final apiFailure = failure as ApiFailure;
      expect(apiFailure.errorCode, 'PHONE_ALREADY_REGISTERED');
      expect(apiFailure.statusCode, 409);
      expect(apiFailure.traceId, 'trace-123');
    });

    test('a 5xx response with no parseable envelope maps to ServerFailure', () {
      final failure = mapDioExceptionToFailure(
        DioException(
          requestOptions: _options(),
          type: DioExceptionType.badResponse,
          response: Response(requestOptions: _options(), statusCode: 503, data: 'Service Unavailable'),
        ),
      );
      expect(failure, isA<ServerFailure>());
      expect((failure as ServerFailure).statusCode, 503);
    });
  });
}
