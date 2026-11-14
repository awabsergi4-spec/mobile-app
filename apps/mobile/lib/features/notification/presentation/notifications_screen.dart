import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/empty_state_view.dart';
import '../application/notification_controller.dart';
import '../domain/notification.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final notifications = ref.watch(myNotificationsControllerProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.notificationsTitle),
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all),
            tooltip: l10n.notificationsMarkAllRead,
            onPressed: () => ref.read(myNotificationsControllerProvider.notifier).markAllRead(),
          ),
        ],
      ),
      body: AsyncValueView<List<AppNotification>>(
        value: notifications,
        onRetry: () => ref.invalidate(myNotificationsControllerProvider),
        data: (context, data) {
          if (data.isEmpty) {
            return EmptyStateView(message: l10n.notificationsNoNotifications);
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(myNotificationsControllerProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(AppSpacing.base),
              itemCount: data.length,
              separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
              itemBuilder: (context, index) {
                final notification = data[index];
                return Card(
                  color: notification.isUnread ? Theme.of(context).colorScheme.primary.withValues(alpha: 0.06) : null,
                  child: ListTile(
                    onTap: () {
                      if (notification.isUnread) {
                        ref.read(myNotificationsControllerProvider.notifier).markRead(notification.id);
                      }
                    },
                    leading: notification.isUnread
                        ? Icon(Icons.circle, size: 10, color: Theme.of(context).colorScheme.primary)
                        : const SizedBox(width: 10),
                    title: Text(notification.title, style: TextStyle(fontWeight: notification.isUnread ? FontWeight.bold : null)),
                    subtitle: Text(notification.body, maxLines: 2, overflow: TextOverflow.ellipsis),
                    trailing: Text(
                      notification.createdAt.toLocal().toString().split(' ').first,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
