import 'package:flutter/material.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../core/theme/app_spacing.dart';

/// Centered icon + message for "list has zero items" — every feature's
/// list screen (on-demand requests, contracts, notifications, wallet
/// transactions, ...) uses this instead of a bare `Text` so the empty
/// state looks the same everywhere. Caller supplies the already-localized
/// message; this widget owns only layout, not copy.
class EmptyStateView extends StatelessWidget {
  const EmptyStateView({super.key, required this.message, this.icon = Symbols.inbox, this.action});

  final String message;
  final IconData icon;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 48, color: colorScheme.onSurfaceVariant),
            const SizedBox(height: AppSpacing.md),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
            ),
            if (action != null) ...[
              const SizedBox(height: AppSpacing.lg),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}
