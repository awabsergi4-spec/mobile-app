import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../storage/secure_token_storage.dart';
import '../../features/auth/application/auth_controller.dart';
import 'api_client.dart';

final secureTokenStorageProvider = Provider<SecureTokenStorage>((ref) => SecureTokenStorage());

/// `onSessionExpired` reads `authControllerProvider` lazily, only when a
/// 401-after-failed-refresh actually happens — not during this provider's
/// own build — so there's no circular *construction* dependency even
/// though AuthController (built later, on demand) also depends on
/// apiClientProvider. See AuthInterceptor for why this callback exists.
final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(
    tokenStorage: ref.watch(secureTokenStorageProvider),
    onSessionExpired: () async {
      await ref.read(authControllerProvider.notifier).handleSessionExpired();
    },
  );
});
