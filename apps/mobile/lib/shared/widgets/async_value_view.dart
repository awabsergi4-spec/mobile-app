import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/errors/app_failure.dart';
import '../../core/errors/failure_localizer.dart';
import '../../core/l10n/generated/app_localizations.dart';
import 'error_banner.dart';

/// Single consistent loading/error/data rendering for every
/// AsyncNotifier/FutureProvider-backed screen — repositories return
/// `Result<T>`, and controllers re-throw the `AppFailure` on failure so it
/// lands in `AsyncValue.error` and is rendered here the same way
/// `ErrorBanner` already renders form-submit failures (see
/// features/auth/presentation/login_screen.dart).
class AsyncValueView<T> extends StatelessWidget {
  const AsyncValueView({
    super.key,
    required this.value,
    required this.data,
    this.onRetry,
    this.loading,
  });

  final AsyncValue<T> value;
  final Widget Function(BuildContext context, T data) data;
  final VoidCallback? onRetry;

  /// Optional loading placeholder (e.g. `SkeletonList`); defaults to a spinner.
  final Widget? loading;

  @override
  Widget build(BuildContext context) {
    return value.when(
      data: (d) => data(context, d),
      loading: () => loading ?? const Center(child: CircularProgressIndicator()),
      error: (error, stackTrace) {
        final l10n = AppLocalizations.of(context)!;
        final message = error is AppFailure ? localizeFailure(l10n, error) : l10n.errorGeneric;
        return Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ErrorBanner(message: message),
                if (onRetry != null) ...[
                  const SizedBox(height: 16),
                  OutlinedButton(onPressed: onRetry, child: Text(l10n.retry)),
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}
