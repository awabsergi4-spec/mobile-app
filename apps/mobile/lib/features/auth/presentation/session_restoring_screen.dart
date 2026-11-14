import 'package:flutter/material.dart';

import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';

/// Shown at app startup while AuthController.restoreSession() is deciding
/// whether a stored session is still valid — never a blank screen while
/// that network call is in flight.
class SessionRestoringScreen extends StatelessWidget {
  const SessionRestoringScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: AppSpacing.lg),
            Text(l10n.sessionRestoring, style: Theme.of(context).textTheme.bodyMedium),
          ],
        ),
      ),
    );
  }
}
