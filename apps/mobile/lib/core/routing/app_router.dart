import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/application/auth_controller.dart';
import '../../features/auth/application/auth_state.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/register_screen.dart';
import '../../features/auth/presentation/session_restoring_screen.dart';
import '../../features/auth/presentation/welcome_screen.dart';
import '../../features/home/presentation/home_screen.dart';
import '../../features/on_demand/presentation/create_on_demand_request_screen.dart';
import '../../features/on_demand/presentation/on_demand_request_detail_screen.dart';
import '../../features/on_demand/presentation/on_demand_request_list_screen.dart';
import '../../features/on_demand/presentation/provider_assignment_list_screen.dart';
import '../../features/contract/presentation/browse_contract_projects_screen.dart';
import '../../features/contract/presentation/contract_detail_screen.dart';
import '../../features/contract/presentation/contract_project_detail_screen.dart';
import '../../features/contract/presentation/create_contract_project_screen.dart';
import '../../features/contract/presentation/my_contract_bids_screen.dart';
import '../../features/contract/presentation/my_contract_projects_screen.dart';
import '../../features/company/presentation/company_members_screen.dart';
import '../../features/company/presentation/company_verification_screen.dart';
import '../../features/company/presentation/my_company_invitations_screen.dart';
import '../../features/provider/presentation/provider_profile_screen.dart';
import '../../features/provider/presentation/provider_verification_screen.dart';
import '../../features/provider/presentation/provider_portfolio_screen.dart';
import '../../features/provider/presentation/provider_payout_accounts_screen.dart';
import '../../features/remote/presentation/create_remote_engagement_screen.dart';
import '../../features/remote/presentation/my_remote_engagements_screen.dart';
import '../../features/remote/presentation/remote_engagement_detail_screen.dart';
import '../../features/wallet/presentation/wallet_screen.dart';
import '../../features/wallet/presentation/withdrawals_screen.dart';
import '../../features/dispute/presentation/my_disputes_screen.dart';
import '../../features/notification/presentation/notifications_screen.dart';

/// Notifies GoRouter to re-run its `redirect` callback whenever auth state
/// changes — GoRouter's `refreshListenable` wants a plain ChangeNotifier,
/// not a Riverpod provider directly, so this is the bridge between the two.
class _AuthRouterRefreshNotifier extends ChangeNotifier {
  _AuthRouterRefreshNotifier(Ref ref) {
    ref.listen(authControllerProvider, (previous, next) {
      if (previous?.status != next.status) notifyListeners();
    });
  }
}

const _unauthenticatedRoutes = {'/', '/login', '/register'};

/// GoRouter is built once (Provider, not recreated per auth-state change —
/// that would reset the navigation stack); only its `redirect` re-runs, via
/// `refreshListenable`. The redirect is the single place that decides who
/// can see what — no screen guards itself, per docs/00-system-architecture.md.
final goRouterProvider = Provider<GoRouter>((ref) {
  final refreshNotifier = _AuthRouterRefreshNotifier(ref);

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

      // authenticated
      if (location == '/splash' || _unauthenticatedRoutes.contains(location)) {
        return '/home';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (context, state) => const SessionRestoringScreen()),
      GoRoute(path: '/', builder: (context, state) => const WelcomeScreen()),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/register', builder: (context, state) => const RegisterScreen()),
      GoRoute(path: '/home', builder: (context, state) => const HomeScreen()),
      GoRoute(path: '/on-demand', builder: (context, state) => const OnDemandRequestListScreen()),
      GoRoute(path: '/on-demand/new', builder: (context, state) => const CreateOnDemandRequestScreen()),
      GoRoute(path: '/on-demand/offers', builder: (context, state) => const ProviderAssignmentListScreen()),
      GoRoute(
        path: '/on-demand/:id',
        builder: (context, state) => OnDemandRequestDetailScreen(requestId: state.pathParameters['id']!),
      ),
      GoRoute(path: '/contracts', builder: (context, state) => const MyContractProjectsScreen()),
      GoRoute(path: '/contracts/new', builder: (context, state) => const CreateContractProjectScreen()),
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
      GoRoute(path: '/remote/new', builder: (context, state) => const CreateRemoteEngagementScreen()),
      GoRoute(path: '/remote/bookings', builder: (context, state) => const MyRemoteEngagementsScreen(asProvider: true)),
      GoRoute(
        path: '/remote/:id',
        builder: (context, state) => RemoteEngagementDetailScreen(engagementId: state.pathParameters['id']!),
      ),
      GoRoute(path: '/wallet', builder: (context, state) => const WalletScreen()),
      GoRoute(path: '/wallet/withdrawals', builder: (context, state) => const WithdrawalsScreen()),
      GoRoute(path: '/disputes', builder: (context, state) => const MyDisputesScreen()),
      GoRoute(path: '/notifications', builder: (context, state) => const NotificationsScreen()),
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
