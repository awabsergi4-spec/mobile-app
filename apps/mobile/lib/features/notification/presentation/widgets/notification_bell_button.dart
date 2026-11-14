import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/l10n/generated/app_localizations.dart';
import '../../application/notification_controller.dart';

/// Badge count comes from `unreadNotificationCountProvider`'s 30s poll —
/// no Firebase/push needed for the badge to stay roughly current.
class NotificationBellButton extends ConsumerWidget {
  const NotificationBellButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final unreadCount = ref.watch(unreadNotificationCountProvider).valueOrNull ?? 0;

    return IconButton(
      tooltip: l10n.notificationsTitle,
      onPressed: () => context.push('/notifications'),
      icon: Badge(
        label: Text(unreadCount.toString()),
        isLabelVisible: unreadCount > 0,
        child: const Icon(Icons.notifications_outlined),
      ),
    );
  }
}
