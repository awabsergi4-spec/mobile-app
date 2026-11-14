import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../features/account/presentation/account_settings_screens.dart';
import '../../features/account/presentation/support_screens.dart';
import '../../features/auth/application/auth_controller.dart';
import '../../features/auth/application/auth_state.dart';
import '../../features/auth/domain/current_user.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/register_screen.dart';
import '../../features/auth/presentation/session_restoring_screen.dart';
import '../../features/auth/presentation/welcome_screen.dart';
import '../../features/catalog/presentation/provider_profile_public_screen.dart';
import '../../features/catalog/presentation/search_screen.dart';
import '../../features/catalog/presentation/service_details_screen.dart';
import '../../features/company/presentation/company_members_screen.dart';
import '../../features/company/presentation/company_verification_screen.dart';
import '../../features/company/presentation/my_company_invitations_screen.dart';
import '../../features/contract/presentation/browse_contract_projects_screen.dart';
import '../../features/contract/presentation/contract_detail_screen.dart';
import '../../features/contract/presentation/contract_project_detail_screen.dart';
import '../../features/contract/presentation/create_contract_project_screen.dart';
import '../../features/contract/presentation/my_contract_bids_screen.dart';
import '../../features/contract/presentation/my_contract_projects_screen.dart';
import '../../features/dispute/presentation/my_disputes_screen.dart';
import '../../features/explore/presentation/explore_screen.dart';
import '../../features/home/presentation/company_home_screen.dart';
import '../../features/home/presentation/customer_home_screen.dart';
import '../../features/home/presentation/customer_requests_screen.dart';
import '../../features/home/presentation/provider_home_screen.dart';
import '../../features/home/presentation/provider_hub_screens.dart';
import '../../features/notification/presentation/notifications_screen.dart';
import '../../features/on_demand/presentation/booking_screen.dart';
import '../../features/on_demand/presentation/on_demand_request_detail_screen.dart';
import '../../features/on_demand/presentation/on_demand_request_list_screen.dart';
import '../../features/on_demand/presentation/provider_assignment_list_screen.dart';
import '../../features/provider/presentation/provider_payout_accounts_screen.dart';
import '../../features/provider/presentation/provider_portfolio_screen.dart';
import '../../features/provider/presentation/provider_profile_screen.dart';
import '../../features/provider/presentation/provider_verification_screen.dart';
import '../../features/remote/presentation/create_remote_engagement_screen.dart';
import '../../features/remote/presentation/my_remote_engagements_screen.dart';
import '../../features/remote/presentation/remote_engagement_detail_screen.dart';
import '../../features/settings/presentation/account_screen.dart';
import '../../features/shell/presentation/role_shell.dart';
import '../../features/wallet/presentation/wallet_screen.dart';
import '../../features/wallet/presentation/withdrawals_screen.dart';
import '../l10n/generated/app_localizations.dart';

/// Re-runs GoRouter's `redirect` when the auth status or the user's role
/// (workspace) changes — e.g. after login, logout, or accepting a company
/// invitation that turns a customer into a company member.
class _AuthRouterRefreshNotifier extends ChangeNotifier {
  _AuthRouterRefreshNotifier(Ref ref) {
    ref.listen(authControllerProvider, (previous, next) {
      if (previous?.status != next.status || previous?.user?.workspace != next.user?.workspace) {
        notifyListeners();
      }
    });
  }
}

const _unauthenticatedRoutes = {'/', '/login', '/register'};

/// First tab of each role's shell.
String roleHomePath(UserWorkspace workspace) => switch (workspace) {
      UserWorkspace.customer => '/c/home',
      UserWorkspace.provider => '/p/dashboard',
      UserWorkspace.company => '/co/dashboard',
    };

/// Which role a location belongs to, or null if any signed-in user may open it.
UserWorkspace? _roleOwningLocation(String location) {
  if (location.startsWith('/c/')) return UserWorkspace.customer;
  if (location.startsWith('/p/') || location.startsWith('/provider/')) return UserWorkspace.provider;
  if (location.startsWith('/co/')) return UserWorkspace.company;
  // /company/:id/members|verification are company-admin screens;
  // /company/invitations is for anyone who was invited.
  if (location.startsWith('/company/') && location != '/company/invitations') return UserWorkspace.company;
  return null;
}

/// GoRouter is built once (not recreated per auth change — that would reset
/// navigation); only `redirect` re-runs via `refreshListenable`. The redirect
/// is the single place deciding who can see what.
final goRouterProvider = Provider<GoRouter>((ref) {
  final refreshNotifier = _AuthRouterRefreshNotifier(ref);
  String companyId() => ref.read(authControllerProvider).user?.companyId ?? '';

  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: refreshNotifier,
    redirect: (context, state) {
      final auth = ref.read(authControllerProvider);
      final location = state.matchedLocation;

      if (auth.status == AuthStatus.initial || auth.status == AuthStatus.restoring) {
        return location == '/splash' ? null : '/splash';
      }

      if (auth.status == AuthStatus.unauthenticated) {
        return _unauthenticatedRoutes.contains(location) ? null : '/';
      }

      // Authenticated. The user can be momentarily null while /users/me loads.
      final user = auth.user;
      if (user == null) return null;
      final home = roleHomePath(user.workspace);

      if (location == '/splash' || location == '/home' || _unauthenticatedRoutes.contains(location)) {
        return home;
      }
      final owner = _roleOwningLocation(location);
      if (owner != null && owner != user.workspace) {
        return home; // never show another role's screens
      }
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (context, state) => const SessionRestoringScreen()),
      GoRoute(path: '/', builder: (context, state) => const WelcomeScreen()),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/register', builder: (context, state) => const RegisterScreen()),
      // Legacy entry point — always redirected to the role's first tab.
      GoRoute(path: '/home', builder: (context, state) => const SessionRestoringScreen()),

      // ── Customer shell ────────────────────────────────────────────────
      StatefulShellRoute.indexedStack(
        builder: (context, state, shell) {
          final l10n = AppLocalizations.of(context)!;
          return RoleShell(navigationShell: shell, destinations: [
            ShellDestination(icon: Symbols.home, selectedIcon: Symbols.home_filled, label: l10n.navHome),
            ShellDestination(icon: Symbols.explore, selectedIcon: Symbols.explore, label: l10n.navExplore),
            ShellDestination(icon: Symbols.receipt_long, selectedIcon: Symbols.receipt_long, label: l10n.navRequests),
            ShellDestination(icon: Symbols.account_balance_wallet, selectedIcon: Symbols.account_balance_wallet, label: l10n.navWallet),
            ShellDestination(icon: Symbols.person, selectedIcon: Symbols.person, label: l10n.navProfile),
          ]);
        },
        branches: [
          StatefulShellBranch(routes: [GoRoute(path: '/c/home', builder: (c, s) => const CustomerHomeScreen())]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/c/explore', builder: (c, s) => ExploreScreen(initialType: s.uri.queryParameters['type'])),
          ]),
          StatefulShellBranch(routes: [GoRoute(path: '/c/requests', builder: (c, s) => const CustomerRequestsScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/c/wallet', builder: (c, s) => const WalletScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/c/profile', builder: (c, s) => const AccountScreen())]),
        ],
      ),

      // ── Provider shell ────────────────────────────────────────────────
      StatefulShellRoute.indexedStack(
        builder: (context, state, shell) {
          final l10n = AppLocalizations.of(context)!;
          return RoleShell(navigationShell: shell, destinations: [
            ShellDestination(icon: Symbols.dashboard, selectedIcon: Symbols.dashboard, label: l10n.navDashboard),
            ShellDestination(icon: Symbols.work, selectedIcon: Symbols.work, label: l10n.navJobs),
            ShellDestination(icon: Symbols.home_repair_service, selectedIcon: Symbols.home_repair_service, label: l10n.navServices),
            ShellDestination(icon: Symbols.payments, selectedIcon: Symbols.payments, label: l10n.navEarnings),
            ShellDestination(icon: Symbols.person, selectedIcon: Symbols.person, label: l10n.navProfile),
          ]);
        },
        branches: [
          StatefulShellBranch(routes: [GoRoute(path: '/p/dashboard', builder: (c, s) => const ProviderHomeScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/p/jobs', builder: (c, s) => const ProviderJobsScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/p/services', builder: (c, s) => const ProviderServicesScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/p/earnings', builder: (c, s) => const WalletScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/p/profile', builder: (c, s) => const AccountScreen())]),
        ],
      ),

      // ── Company shell ─────────────────────────────────────────────────
      StatefulShellRoute.indexedStack(
        builder: (context, state, shell) {
          final l10n = AppLocalizations.of(context)!;
          return RoleShell(navigationShell: shell, destinations: [
            ShellDestination(icon: Symbols.dashboard, selectedIcon: Symbols.dashboard, label: l10n.navDashboard),
            ShellDestination(icon: Symbols.work, selectedIcon: Symbols.work, label: l10n.navJobs),
            ShellDestination(icon: Symbols.groups, selectedIcon: Symbols.groups, label: l10n.navTeam),
            ShellDestination(icon: Symbols.monitoring, selectedIcon: Symbols.monitoring, label: l10n.navFinance),
            ShellDestination(icon: Symbols.person, selectedIcon: Symbols.person, label: l10n.navProfile),
          ]);
        },
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(path: '/co/dashboard', builder: (c, s) => CompanyHomeScreen(companyId: companyId())),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/co/jobs',
              builder: (c, s) {
                final l10n = AppLocalizations.of(c)!;
                return CompanyFeatureUnavailableScreen(
                  title: l10n.navJobs,
                  heading: l10n.companyJobsUnavailableTitle,
                  message: l10n.companyJobsUnavailable,
                  icon: Symbols.work,
                );
              },
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/co/team', builder: (c, s) => CompanyMembersScreen(companyId: companyId())),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/co/finance',
              builder: (c, s) {
                final l10n = AppLocalizations.of(c)!;
                return CompanyFeatureUnavailableScreen(
                  title: l10n.navFinance,
                  heading: l10n.companyFinanceUnavailableTitle,
                  message: l10n.companyFinanceUnavailable,
                  icon: Symbols.monitoring,
                );
              },
            ),
          ]),
          StatefulShellBranch(routes: [GoRoute(path: '/co/profile', builder: (c, s) => const AccountScreen())]),
        ],
      ),

      // ── Detail screens (pushed full-screen over the shells) ───────────
      GoRoute(path: '/on-demand', builder: (context, state) => const OnDemandRequestListScreen()),
      GoRoute(path: '/search', builder: (context, state) => const SearchScreen()),
      GoRoute(
        path: '/services/:categoryId',
        builder: (context, state) => ServiceDetailsScreen(categoryId: state.pathParameters['categoryId']!),
      ),
      GoRoute(
        path: '/providers/:id',
        builder: (context, state) => ProviderProfilePublicScreen(providerId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/providers/:id/reviews',
        builder: (context, state) => ProviderReviewsScreen(providerId: state.pathParameters['id']!),
      ),
      GoRoute(path: '/book', builder: (context, state) => BookingScreen(categoryId: state.uri.queryParameters['categoryId'])),
      GoRoute(path: '/on-demand/new', redirect: (context, state) => '/book'),
      GoRoute(path: '/on-demand/offers', builder: (context, state) => const ProviderAssignmentListScreen()),
      GoRoute(
        path: '/on-demand/:id',
        builder: (context, state) => OnDemandRequestDetailScreen(requestId: state.pathParameters['id']!),
      ),
      GoRoute(path: '/contracts', builder: (context, state) => const MyContractProjectsScreen()),
      GoRoute(
        path: '/contracts/new',
        builder: (context, state) => CreateContractProjectScreen(initialCategoryId: state.uri.queryParameters['categoryId']),
      ),
      GoRoute(path: '/contracts/browse', builder: (context, state) => const BrowseContractProjectsScreen()),
      GoRoute(path: '/contracts/my-bids', builder: (context, state) => const MyContractBidsScreen()),
      GoRoute(
        path: '/contracts/projects/:id',
        builder: (context, state) => ContractProjectDetailScreen(projectId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/contracts/:id',
        builder: (context, state) => ContractDetailScreen(contractId: state.pathParameters['id']!),
      ),
      GoRoute(path: '/remote', builder: (context, state) => const MyRemoteEngagementsScreen(asProvider: false)),
      GoRoute(
        path: '/remote/new',
        builder: (context, state) => CreateRemoteEngagementScreen(
          initialCategoryId: state.uri.queryParameters['categoryId'],
          initialProviderId: state.uri.queryParameters['providerId'],
        ),
      ),
      GoRoute(path: '/remote/bookings', builder: (context, state) => const MyRemoteEngagementsScreen(asProvider: true)),
      GoRoute(
        path: '/remote/:id',
        builder: (context, state) => RemoteEngagementDetailScreen(engagementId: state.pathParameters['id']!),
      ),
      GoRoute(path: '/wallet', builder: (context, state) => const WalletScreen()),
      GoRoute(path: '/wallet/withdrawals', builder: (context, state) => const WithdrawalsScreen()),
      GoRoute(path: '/disputes', builder: (context, state) => const MyDisputesScreen()),
      GoRoute(path: '/notifications', builder: (context, state) => const NotificationsScreen()),
      GoRoute(path: '/account/edit', builder: (context, state) => const EditProfileScreen()),
      GoRoute(path: '/account/password', builder: (context, state) => const ChangePasswordScreen()),
      GoRoute(path: '/account/notifications', builder: (context, state) => const NotificationPrefsScreen()),
      GoRoute(path: '/support', builder: (context, state) => const SupportTicketsScreen()),
      GoRoute(path: '/support/new', builder: (context, state) => const NewSupportTicketScreen()),
      GoRoute(
        path: '/support/:id',
        builder: (context, state) => SupportTicketScreen(ticketId: state.pathParameters['id']!),
      ),
      GoRoute(path: '/company/invitations', builder: (context, state) => const MyCompanyInvitationsScreen()),
      GoRoute(
        path: '/company/:id/members',
        builder: (context, state) => CompanyMembersScreen(companyId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/company/:id/verification',
        builder: (context, state) => CompanyVerificationScreen(companyId: state.pathParameters['id']!),
      ),
      GoRoute(path: '/provider/profile', builder: (context, state) => const ProviderProfileScreen()),
      GoRoute(path: '/provider/verification', builder: (context, state) => const ProviderVerificationScreen()),
      GoRoute(path: '/provider/portfolio', builder: (context, state) => const ProviderPortfolioScreen()),
      GoRoute(path: '/provider/payout-accounts', builder: (context, state) => const ProviderPayoutAccountsScreen()),
    ],
  );
});
