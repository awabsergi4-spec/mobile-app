import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/networking/providers.dart';
import '../data/notification_repository.dart';
import '../data/notification_repository_impl.dart';
import '../domain/notification.dart';

final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  return NotificationRepositoryImpl(apiClient: ref.watch(apiClientProvider));
});

class MyNotificationsController extends AsyncNotifier<List<AppNotification>> {
  @override
  Future<List<AppNotification>> build() async {
    final result = await ref.read(notificationRepositoryProvider).listMy();
    return result.when(success: (v) => v, failure: (f) => throw f);
  }

  Future<void> markRead(String id) async {
    final result = await ref.read(notificationRepositoryProvider).markRead(id);
    if (result.isSuccess) {
      ref.invalidateSelf();
      ref.invalidate(unreadNotificationCountProvider);
    }
  }

  Future<void> markAllRead() async {
    final result = await ref.read(notificationRepositoryProvider).markAllRead();
    if (result.isSuccess) {
      ref.invalidateSelf();
      ref.invalidate(unreadNotificationCountProvider);
    }
  }
}

final myNotificationsControllerProvider = AsyncNotifierProvider<MyNotificationsController, List<AppNotification>>(
  MyNotificationsController.new,
);

/// Polls the unread count every 30s while any widget is watching it — no
/// Firebase/push needed for a "you have new notifications" badge that
/// still updates without a manual pull-to-refresh.
final unreadNotificationCountProvider = StreamProvider<int>((ref) async* {
  final repo = ref.watch(notificationRepositoryProvider);

  Future<int> fetch() async {
    final result = await repo.unreadCount();
    return result.when(success: (v) => v, failure: (_) => 0);
  }

  yield await fetch();
  yield* Stream.periodic(const Duration(seconds: 30)).asyncMap((_) => fetch());
});
