/// Normalized frontend error model — every repository call that can fail
/// returns (or throws) one of these instead of a raw DioException/backend
/// payload, so the UI layer never has to know whether a failure came from
/// the network, a timeout, or a specific backend errorCode. See
/// core/errors/failure_localizer.dart for turning one of these into a
/// localized, user-facing string.
sealed class AppFailure {
  const AppFailure({this.traceId});

  /// Present on ApiFailure (and sometimes ServerFailure) responses — kept
  /// around for support/debugging surfaces even though it's not shown to
  /// the user by default.
  final String? traceId;
}

/// No connectivity, or the request timed out before a response arrived.
class NetworkFailure extends AppFailure {
  const NetworkFailure({required this.isTimeout});
  final bool isTimeout;
}

/// The backend responded with its standard error envelope
/// (`{success:false, errorCode, message, details, traceId, timestamp}`).
/// `errorCode` is the backend's stable machine-readable code (e.g.
/// "INVALID_CREDENTIALS") — the localizer keys off this, not `message`
/// (which is backend-authored English and never shown directly).
class ApiFailure extends AppFailure {
  const ApiFailure({
    required this.statusCode,
    required this.errorCode,
    required this.backendMessage,
    this.details,
    super.traceId,
  });

  final int statusCode;
  final String errorCode;
  final String backendMessage;
  final Map<String, dynamic>? details;
}

/// A 401 that survived a refresh attempt (or arrived with no refresh
/// token available at all) — the caller must be signed out, not just
/// shown an error.
class UnauthorizedFailure extends AppFailure {
  const UnauthorizedFailure();
}

/// 5xx, or a 2xx envelope that failed to parse — something is wrong on
/// the backend/response-shape side, not something the user did.
class ServerFailure extends AppFailure {
  const ServerFailure({this.statusCode, super.traceId});
  final int? statusCode;
}

/// Anything that doesn't fit the above — surfaced as the generic error
/// message, never as a raw exception string.
class UnknownFailure extends AppFailure {
  const UnknownFailure(this.error);
  final Object error;
}
