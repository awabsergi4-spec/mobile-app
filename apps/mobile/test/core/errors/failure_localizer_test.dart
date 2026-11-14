import 'package:flutter_test/flutter_test.dart';
import 'package:sahl_mobile/core/errors/app_failure.dart';
import 'package:sahl_mobile/core/errors/failure_localizer.dart';
import 'package:sahl_mobile/core/l10n/generated/app_localizations_en.dart';
import 'package:sahl_mobile/core/l10n/generated/app_localizations_ar.dart';

void main() {
  final en = AppLocalizationsEn();
  final ar = AppLocalizationsAr();

  group('localizeFailure', () {
    test('never returns the raw backendMessage', () {
      const failure = ApiFailure(statusCode: 400, errorCode: 'SOME_UNKNOWN_CODE', backendMessage: 'raw backend text');
      final message = localizeFailure(en, failure);
      expect(message, isNot(contains('raw backend text')));
    });

    test('known errorCodes map to their specific localized string', () {
      expect(
        localizeFailure(en, const ApiFailure(statusCode: 401, errorCode: 'INVALID_CREDENTIALS', backendMessage: '')),
        en.errorInvalidCredentials,
      );
      expect(
        localizeFailure(en, const ApiFailure(statusCode: 403, errorCode: 'ACCOUNT_PENDING_APPROVAL', backendMessage: '')),
        en.errorAccountPendingApproval,
      );
      expect(
        localizeFailure(en, const ApiFailure(statusCode: 409, errorCode: 'PHONE_ALREADY_REGISTERED', backendMessage: '')),
        en.errorPhoneAlreadyRegistered,
      );
    });

    test('an unrecognized errorCode falls back to a status-based message, never blank', () {
      final message = localizeFailure(
        en,
        const ApiFailure(statusCode: 422, errorCode: 'SOMETHING_NEW', backendMessage: ''),
      );
      expect(message, en.errorValidation);
    });

    test('UnauthorizedFailure -> session expired message', () {
      expect(localizeFailure(en, const UnauthorizedFailure()), en.errorSessionExpired);
    });

    test('NetworkFailure timeout vs offline are distinguished', () {
      expect(localizeFailure(en, const NetworkFailure(isTimeout: true)), en.errorTimeout);
      expect(localizeFailure(en, const NetworkFailure(isTimeout: false)), en.errorNoConnection);
    });

    test('resolves correctly in Arabic too', () {
      expect(
        localizeFailure(ar, const ApiFailure(statusCode: 401, errorCode: 'INVALID_CREDENTIALS', backendMessage: '')),
        ar.errorInvalidCredentials,
      );
    });
  });
}
