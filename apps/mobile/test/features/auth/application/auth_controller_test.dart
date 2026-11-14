import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sahl_mobile/core/errors/app_failure.dart';
import 'package:sahl_mobile/core/utils/result.dart';
import 'package:sahl_mobile/features/auth/application/auth_controller.dart';
import 'package:sahl_mobile/features/auth/application/auth_state.dart';
import 'package:sahl_mobile/features/auth/domain/account_type.dart';

import '../fakes/fake_auth_repository.dart';

/// build()'s own fire-and-forget restoreSession() (scheduled via
/// Future.microtask so build() can return synchronously) would otherwise
/// race with whatever action a test calls immediately after reading the
/// notifier for the first time. Draining it here — once, deterministically
/// — mirrors the real app, where the login/register screens are only
/// reachable *after* the router's redirect has already observed
/// AuthStatus.unauthenticated, i.e. after restoration has already
/// finished; that ordering can't be skipped through normal navigation, so
/// tests shouldn't skip it either.
Future<ProviderContainer> _buildContainer(FakeAuthRepository repo) async {
  final container = ProviderContainer(overrides: [authRepositoryProvider.overrideWithValue(repo)]);
  addTearDown(container.dispose);
  await container.read(authControllerProvider.notifier).restoreSession();
  return container;
}

void main() {
  group('AuthController.restoreSession', () {
    test('no stored session -> unauthenticated, no network call needed', () async {
      final repo = FakeAuthRepository()..storedSession = false;
      final container = await _buildContainer(repo);

      expect(container.read(authControllerProvider).status, AuthStatus.unauthenticated);
    });

    test('stored session + valid token -> authenticated with the fetched user', () async {
      final repo = FakeAuthRepository()
        ..storedSession = true
        ..currentUserResult = const Result.success(testUser);
      final container = await _buildContainer(repo);

      final state = container.read(authControllerProvider);
      expect(state.status, AuthStatus.authenticated);
      expect(state.user?.id, testUser.id);
    });

    test('stored session but the token is no longer valid -> unauthenticated', () async {
      final repo = FakeAuthRepository()
        ..storedSession = true
        ..currentUserResult = const Result.failure(UnauthorizedFailure());
      final container = await _buildContainer(repo);

      expect(container.read(authControllerProvider).status, AuthStatus.unauthenticated);
    });
  });

  group('AuthController.login', () {
    test('success loads the current user and moves to authenticated', () async {
      final repo = FakeAuthRepository()
        ..loginResult = const Result.success(null)
        ..currentUserResult = const Result.success(testUser);
      final container = await _buildContainer(repo);

      final result = await container.read(authControllerProvider.notifier).login(
            phone: testUser.phone,
            password: 'password123',
          );

      expect(result.isSuccess, isTrue);
      expect(container.read(authControllerProvider).status, AuthStatus.authenticated);
    });

    test('invalid credentials -> returns the failure, stays unauthenticated', () async {
      final repo = FakeAuthRepository()
        ..loginResult = const Result.failure(
          ApiFailure(statusCode: 401, errorCode: 'INVALID_CREDENTIALS', backendMessage: 'Invalid phone or password'),
        );
      final container = await _buildContainer(repo);

      final result = await container.read(authControllerProvider.notifier).login(
            phone: '+249900000000',
            password: 'wrong',
          );

      expect(result, isA<Failure<void>>());
      expect(container.read(authControllerProvider).status, AuthStatus.unauthenticated);
    });
  });

  group('AuthController.register', () {
    test('passes the account type through and never starts a session (admin approval required)', () async {
      final repo = FakeAuthRepository();
      final container = await _buildContainer(repo);

      final result = await container.read(authControllerProvider.notifier).register(
            phone: '+249912345678',
            password: 'Secret123',
            fullName: 'New Provider',
            preferredLanguage: 'ar',
            accountType: AccountType.provider,
            businessName: 'Fix It',
          );

      expect(result, isA<Success<void>>());
      expect(repo.lastRegisteredAccountType, AccountType.provider);
      expect(repo.lastRegisteredBusinessName, 'Fix It');
      expect(container.read(authControllerProvider).status, isNot(AuthStatus.authenticated));
    });
  });

  group('AuthController.logout / handleSessionExpired', () {
    test('logout calls the repository and moves to unauthenticated', () async {
      final repo = FakeAuthRepository()
        ..storedSession = true
        ..currentUserResult = const Result.success(testUser);
      final container = await _buildContainer(repo);
      expect(container.read(authControllerProvider).status, AuthStatus.authenticated);

      await container.read(authControllerProvider.notifier).logout();

      expect(container.read(authControllerProvider).status, AuthStatus.unauthenticated);
      expect(repo.logoutCallCount, 1);
    });

    test('handleSessionExpired only clears state when it was actually authenticated', () async {
      final repo = FakeAuthRepository();
      final container = await _buildContainer(repo);

      await container.read(authControllerProvider.notifier).handleSessionExpired();

      expect(repo.clearLocalSessionCallCount, 0);
    });

    test('handleSessionExpired clears an authenticated session', () async {
      final repo = FakeAuthRepository()
        ..storedSession = true
        ..currentUserResult = const Result.success(testUser);
      final container = await _buildContainer(repo);

      await container.read(authControllerProvider.notifier).handleSessionExpired();

      expect(container.read(authControllerProvider).status, AuthStatus.unauthenticated);
      expect(repo.clearLocalSessionCallCount, 1);
    });
  });
}
