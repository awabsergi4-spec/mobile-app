import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sahl_mobile/app/app.dart';
import 'package:sahl_mobile/features/auth/application/auth_controller.dart';

import 'features/auth/fakes/fake_auth_repository.dart';

void main() {
  testWidgets('shows a session-restoring splash, then the welcome screen once unauthenticated is confirmed', (tester) async {
    final repo = FakeAuthRepository()..storedSession = false;

    await tester.pumpWidget(
      ProviderScope(
        overrides: [authRepositoryProvider.overrideWithValue(repo)],
        child: const SahlApp(),
      ),
    );

    // Before restoreSession() resolves, the splash is shown — never a
    // blank screen.
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    await tester.pumpAndSettle();

    // Arabic is the default locale; the onboarding headline and CTA show.
    expect(find.text('كل خدماتك'), findsOneWidget);
    expect(find.text('ابدأ الآن'), findsOneWidget);
  });
}
