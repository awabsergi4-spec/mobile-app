import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sahl_mobile/app/app.dart';
import 'package:sahl_mobile/core/remote_config/remote_config_providers.dart';
import 'package:sahl_mobile/core/routing/app_router.dart';
import 'package:sahl_mobile/core/utils/result.dart';
import 'package:sahl_mobile/features/auth/application/auth_controller.dart';
import 'package:sahl_mobile/features/auth/domain/current_user.dart';

import '../../features/auth/fakes/fake_auth_repository.dart';
import '../remote_config/fakes/fake_remote_config_repository.dart';

/// Reuses the real SahlApp (theme/locale/router wiring already proven by
/// widget_test.dart) rather than reassembling MaterialApp.router by hand —
/// this test's subject is redirect logic, not app bootstrapping.
Widget _harness(ProviderContainer container) {
  return UncontrolledProviderScope(container: container, child: const SahlApp());
}

void main() {
  testWidgets('an unauthenticated user hitting /home directly is redirected to the welcome screen', (tester) async {
    final repo = FakeAuthRepository()..storedSession = false;
    final container = ProviderContainer(overrides: [authRepositoryProvider.overrideWithValue(repo)]);
    addTearDown(container.dispose);

    await tester.pumpWidget(_harness(container));
    await tester.pumpAndSettle();

    container.read(goRouterProvider).go('/home');
    await tester.pumpAndSettle();

    expect(container.read(goRouterProvider).routerDelegate.currentConfiguration.uri.path, '/');
  });

  testWidgets('an authenticated user hitting /login is redirected to home, not shown the login form', (tester) async {
    final repo = FakeAuthRepository()
      ..storedSession = true
      ..currentUserResult = const Result.success(testUser);
    final container = ProviderContainer(overrides: [
      authRepositoryProvider.overrideWithValue(repo),
      // testUser has no providerProfile/company, so it lands on
      // CustomerHomeScreen, which fetches the home layout on build —
      // fake it so this redirect-focused test never makes a real Dio call.
      remoteConfigRepositoryProvider.overrideWithValue(FakeRemoteConfigRepository()),
    ]);
    addTearDown(container.dispose);
    await container.read(authControllerProvider.notifier).restoreSession();

    await tester.pumpWidget(_harness(container));
    await tester.pumpAndSettle();

    container.read(goRouterProvider).go('/login');
    await tester.pumpAndSettle();

    expect(container.read(goRouterProvider).routerDelegate.currentConfiguration.uri.path, '/c/home');
  });

  group('role shells', () {
    // Shell tabs may show looping skeleton loaders (no API in tests), so pump a
    // fixed time instead of waiting for all animations to stop.
    Future<void> settle(WidgetTester t) async {
      await t.pump();
      await t.pump(const Duration(milliseconds: 400));
    }

    Future<ProviderContainer> signIn(WidgetTester tester, CurrentUser user) async {
      final repo = FakeAuthRepository()
        ..storedSession = true
        ..currentUserResult = Result.success(user);
      final container = ProviderContainer(overrides: [
        authRepositoryProvider.overrideWithValue(repo),
        remoteConfigRepositoryProvider.overrideWithValue(FakeRemoteConfigRepository()),
      ]);
      addTearDown(container.dispose);
      await container.read(authControllerProvider.notifier).restoreSession();
      await tester.pumpWidget(_harness(container));
      await settle(tester);
      return container;
    }

    String path(ProviderContainer c) => c.read(goRouterProvider).routerDelegate.currentConfiguration.uri.path;

    testWidgets('each role lands on its own first tab', (tester) async {
      expect(path(await signIn(tester, testUser)), '/c/home');
      expect(path(await signIn(tester, testProviderUser)), '/p/dashboard');
      expect(path(await signIn(tester, testCompanyUser)), '/co/dashboard');
    });

    testWidgets('a customer cannot open provider or company screens', (tester) async {
      final container = await signIn(tester, testUser);
      for (final location in ['/p/jobs', '/co/finance', '/provider/portfolio', '/company/co-1/members']) {
        container.read(goRouterProvider).go(location);
        await settle(tester);
        expect(path(container), '/c/home', reason: location);
      }
    });

    testWidgets('a provider cannot open customer screens but can open shared ones', (tester) async {
      final container = await signIn(tester, testProviderUser);
      container.read(goRouterProvider).go('/c/wallet');
      await settle(tester);
      expect(path(container), '/p/dashboard');

      container.read(goRouterProvider).go('/company/invitations');
      await settle(tester);
      expect(path(container), '/company/invitations');
    });

    testWidgets('the customer shell shows its five tabs', (tester) async {
      await signIn(tester, testUser);
      expect(find.byType(NavigationDestination), findsNWidgets(5));
    });
  });
}
