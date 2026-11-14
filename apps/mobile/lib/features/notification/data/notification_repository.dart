import '../../../core/utils/result.dart';
import '../domain/notification.dart';

abstract interface class NotificationRepository {
  Future<Result<List<AppNotification>>> listMy({bool unreadOnly});
  Future<Result<int>> unreadCount();
  Future<Result<void>> markRead(String id);
  Future<Result<int>> markAllRead();
}
