import '../errors/app_failure.dart';

/// A repository call either produced a value or a normalized AppFailure —
/// callers pattern-match with `when` instead of try/catch, keeping
/// AppFailureException confined to the networking layer (see
/// core/networking/app_failure_exception.dart, which repositories catch
/// and convert into `Result.failure`).
sealed class Result<T> {
  const Result();

  const factory Result.success(T value) = Success<T>;
  const factory Result.failure(AppFailure failure) = Failure<T>;

  R when<R>({
    required R Function(T value) success,
    required R Function(AppFailure failure) failure,
  }) {
    final self = this;
    return switch (self) {
      Success<T>(value: final v) => success(v),
      Failure<T>(failure: final f) => failure(f),
    };
  }

  bool get isSuccess => this is Success<T>;
}

final class Success<T> extends Result<T> {
  const Success(this.value);
  final T value;
}

final class Failure<T> extends Result<T> {
  const Failure(this.failure);
  final AppFailure failure;
}
