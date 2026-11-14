import '../utils/result.dart';
import 'app_failure_exception.dart';

/// Runs an ApiClient call and converts its outcome into a [Result] — the
/// same try/catch every repository already writes by hand, in one place.
Future<Result<T>> apiCall<T>(Future<T> Function() call) async {
  try {
    return Result.success(await call());
  } on AppFailureException catch (e) {
    return Result.failure(e.failure);
  }
}

/// Unwraps a [Result] inside a Riverpod provider: value or throw the
/// failure so it lands in `AsyncValue.error` (and `AsyncValueView`).
T unwrap<T>(Result<T> result) => result.when(success: (v) => v, failure: (f) => throw f);
