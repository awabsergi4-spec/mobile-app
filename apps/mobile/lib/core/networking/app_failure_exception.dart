import '../errors/app_failure.dart';

/// Wraps an AppFailure as a throwable — ApiClient throws this for every
/// failed request, so repositories catch one exception type and unwrap
/// `.failure` rather than juggling DioException directly.
class AppFailureException implements Exception {
  const AppFailureException(this.failure);

  final AppFailure failure;

  @override
  String toString() => 'AppFailureException($failure)';
}
