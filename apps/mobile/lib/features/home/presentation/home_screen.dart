import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/application/auth_controller.dart';
import '../../auth/domain/current_user.dart';
import 'company_home_screen.dart';
import 'customer_home_screen.dart';
import 'provider_home_screen.dart';

/// Picks the role-appropriate shell from `CurrentUser.workspace` — GoRouter
/// only ever routes to `/home`; this is the single place that decides
/// which of the three concrete screens actually renders (see
/// core/routing/app_router.dart).
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;
    if (user == null) {
      // Between "authenticated" flipping true and CurrentUser landing in
      // state — GoRouter's redirect already guarantees this is momentary.
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return switch (user.workspace) {
      UserWorkspace.company => CompanyHomeScreen(companyId: user.companyId!),
      UserWorkspace.provider => const ProviderHomeScreen(),
      UserWorkspace.customer => const CustomerHomeScreen(),
    };
  }
}
