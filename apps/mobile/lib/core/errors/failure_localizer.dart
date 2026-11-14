import '../l10n/generated/app_localizations.dart';
import 'app_failure.dart';

/// Turns an AppFailure into a localized, user-facing string. Never surfaces
/// `ApiFailure.backendMessage` (backend-authored English) or a raw
/// exception's `toString()` — those are for logs/telemetry, not the UI.
/// Known backend errorCodes get a specific, actionable message; anything
/// unrecognized falls back to the generic error string rather than a blank
/// or English-only leak.
String localizeFailure(AppLocalizations l10n, AppFailure failure) {
  return switch (failure) {
    NetworkFailure(isTimeout: true) => l10n.errorTimeout,
    NetworkFailure(isTimeout: false) => l10n.errorNoConnection,
    UnauthorizedFailure() => l10n.errorSessionExpired,
    ServerFailure(statusCode: 503) => l10n.errorServerUnavailable,
    ServerFailure() => l10n.errorGeneric,
    ApiFailure(errorCode: final code) => _localizeErrorCode(l10n, code, failure),
    UnknownFailure() => l10n.errorGeneric,
  };
}

String _localizeErrorCode(AppLocalizations l10n, String code, ApiFailure failure) {
  return switch (code) {
    'VALIDATION_ERROR' => l10n.errorValidation,
    'INVALID_CREDENTIALS' => l10n.errorInvalidCredentials,
    'ACCOUNT_NOT_ACTIVE' => l10n.errorAccountNotActive,
    'ACCOUNT_PENDING_APPROVAL' => l10n.errorAccountPendingApproval,
    'USER_NOT_FOUND' => l10n.errorUserNotFound,
    'PHONE_ALREADY_REGISTERED' => l10n.errorPhoneAlreadyRegistered,
    'EMAIL_ALREADY_REGISTERED' => l10n.errorEmailAlreadyRegistered,
    'INVALID_PHONE' => l10n.validationPhoneInvalid,
    'INVALID_JSON' => l10n.errorGeneric,
    'INVALID_REFRESH_TOKEN' || 'REFRESH_TOKEN_REUSE_DETECTED' => l10n.errorSessionExpired,
    'UNAUTHENTICATED' => l10n.errorSessionExpired,
    'FORBIDDEN' => l10n.errorForbidden,
    _ => _localizeByStatus(l10n, failure.statusCode),
  };
}

String _localizeByStatus(AppLocalizations l10n, int statusCode) {
  return switch (statusCode) {
    400 || 422 => l10n.errorValidation,
    401 => l10n.errorSessionExpired,
    403 => l10n.errorForbidden,
    404 => l10n.errorNotFound,
    409 => l10n.errorConflict,
    429 => l10n.errorTooManyRequests,
    >= 500 => l10n.errorServerUnavailable,
    _ => l10n.errorGeneric,
  };
}
