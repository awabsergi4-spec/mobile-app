import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/networking/api_call.dart';
import '../../../core/networking/providers.dart';
import '../data/account_repository.dart';
import '../domain/account_models.dart';

final accountRepositoryProvider = Provider<AccountRepository>(
  (ref) => AccountRepository(ref.watch(apiClientProvider), ref.watch(secureTokenStorageProvider)),
);

final notificationPrefsProvider = FutureProvider.autoDispose<NotificationPrefs>((ref) async {
  return unwrap(await ref.watch(accountRepositoryProvider).notificationPrefs());
});

final supportTicketsProvider = FutureProvider.autoDispose<List<SupportTicket>>((ref) async {
  return unwrap(await ref.watch(accountRepositoryProvider).tickets());
});

final supportTicketProvider = FutureProvider.autoDispose.family<SupportTicket, String>((ref, id) async {
  return unwrap(await ref.watch(accountRepositoryProvider).ticket(id));
});

/// The caller's own review for a job (null if not reviewed yet).
final myReviewForJobProvider =
    FutureProvider.autoDispose.family<MyReview?, ({ReviewJobType type, String jobId})>((ref, key) async {
  return unwrap(await ref.watch(accountRepositoryProvider).myReviewForJob(key.type, key.jobId));
});
