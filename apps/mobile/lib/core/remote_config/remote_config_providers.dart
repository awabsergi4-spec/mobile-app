import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../networking/providers.dart';
import 'remote_config_repository.dart';
import 'remote_config_repository_impl.dart';

final remoteConfigRepositoryProvider = Provider<RemoteConfigRepository>((ref) {
  return RemoteConfigRepositoryImpl(apiClient: ref.watch(apiClientProvider));
});

/// The published home layout, refreshed once per provider lifetime — call
/// `ref.invalidate(homeLayoutProvider)` to force a re-fetch (e.g. pull to
/// refresh). Renders from cache first (AsyncValue starts as whatever
/// `getHomeLayout()` already has synchronously cached) while `refresh()`
/// updates it in the background — see RemoteConfigRepository docs.
final homeLayoutProvider = FutureProvider((ref) async {
  final repo = ref.watch(remoteConfigRepositoryProvider);
  await repo.refresh();
  return repo.getHomeLayout();
});
