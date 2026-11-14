import 'package:flutter/material.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_theme.dart';

/// Centered illustration-style empty state: a tinted icon badge, optional
/// title, message and action. Every list screen uses this so empty states
/// look the same everywhere and follow Light/Dark mode. Caller supplies
/// already-localized copy.
class EmptyStateView extends StatelessWidget {
  const EmptyStateView({super.key, required this.message, this.title, this.icon = Symbols.inbox, this.action});

  final String message;
  final String? title;
  final IconData icon;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              height: 96,
              width: 96,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [colorScheme.primary.withValues(alpha: 0.22), colorScheme.primary.withValues(alpha: 0.04)],
                ),
              ),
              child: Icon(icon, size: 44, color: colorScheme.primary, fill: 1),
            ),
            const SizedBox(height: AppSpacing.lg),
            if (title != null) ...[
              Text(title!, textAlign: TextAlign.center, style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
              const SizedBox(height: AppSpacing.sm),
            ],
            Text(
              message,
              textAlign: TextAlign.center,
              style: textTheme.bodyMedium?.copyWith(color: context.sahl.textMuted, height: 1.5),
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
