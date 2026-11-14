import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/networking/providers.dart';
import '../../../core/remote_config/remote_config_providers.dart';
import '../../../core/utils/result.dart';
import '../../company/application/company_controller.dart';
import '../../company/application/company_documents_controller.dart';
import '../../company/application/company_invitations_controller.dart';
import '../../company/application/company_members_controller.dart';
import '../../company/application/company_sent_invitations_controller.dart';
import '../../contract/application/contract_bid_controller.dart';
import '../../contract/application/contract_controller.dart';
import '../../contract/application/contract_milestone_controller.dart';
import '../../dispute/application/dispute_controller.dart';
import '../../notification/application/notification_controller.dart';
import '../../on_demand/application/on_demand_assignment_controller.dart';
import '../../on_demand/application/on_demand_controller.dart';
import '../../provider/application/provider_controller.dart';
import '../../provider/application/provider_documents_controller.dart';
import '../../provider/application/provider_payout_accounts_controller.dart';
import '../../provider/application/provider_portfolio_controller.dart';
import '../../remote/application/remote_controller.dart';
import '../../remote/application/remote_milestone_controller.dart';
import '../../wallet/application/wallet_controller.dart';
import '../../wallet/application/withdrawal_controller.dart';
import '../data/auth_repository.dart';
import '../data/auth_repository_impl.dart';
import '../domain/account_type.dart';
import 'auth_state.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepositoryImpl(
    apiClient: ref.watch(apiClientProvider),
    tokenStorage: ref.watch(secureTokenStorageProvider),
  );
});

/// The single source of truth for "is anyone logged in, and as whom" —
/// GoRouter's redirect (core/routing/app_router.dart) watches this
/// directly, and every auth screen calls through it rather than the
/// repository, so state stays in one place.
class AuthController extends Notifier<AuthState> {
  @override
  AuthState build() {
    // Fire-and-forget: build() must return synchronously, restoration
    // updates state once it resolves. GoRouter's redirect treats
    // AuthStatus.initial/restoring as "not yet ready to decide" and shows
    // a splash rather than bouncing to /login prematurely.
    Future.microtask(restoreSession);
    return const AuthState.initial();
  }

  Future<void> restoreSession() async {
    state = state.copyWith(status: AuthStatus.restoring);
    final repo = ref.read(authRepositoryProvider);

    final hasSession = await repo.hasStoredSession();
    if (!hasSession) {
      state = const AuthState(status: AuthStatus.unauthenticated);
      return;
    }

    final result = await repo.fetchCurrentUser();
    state = result.when(
      success: (user) => AuthState(status: AuthStatus.authenticated, user: user),
      // A 401 here already went through AuthInterceptor's refresh-and-retry
      // once; if it still failed, the session really is gone.
      failure: (_) => const AuthState(status: AuthStatus.unauthenticated),
    );
  }

  Future<Result<void>> register({
    required String phone,
    required String password,
    required String fullName,
    required String preferredLanguage,
    required AccountType accountType,
    String? email,
    String? businessName,
    String? companyName,
  }) {
    // No session and no OTP: the new account waits for admin approval.
    return ref.read(authRepositoryProvider).register(
          phone: phone,
          password: password,
          fullName: fullName,
          preferredLanguage: preferredLanguage,
          accountType: accountType,
          email: email,
          businessName: businessName,
          companyName: companyName,
        );
  }

  Future<Result<void>> login({required String phone, required String password}) async {
    final result = await ref.read(authRepositoryProvider).login(phone: phone, password: password);
    if (result.isSuccess) {
      await _loadCurrentUser();
    }
    return result;
  }

  Future<void> logout() async {
    await ref.read(authRepositoryProvider).logout();
    state = const AuthState(status: AuthStatus.unauthenticated);
    _invalidateUserScopedProviders();
  }

  /// Called by ApiClient (via apiClientProvider's onSessionExpired) when a
  /// 401 survives a refresh attempt — the backend has already decided this
  /// session is dead, so this only clears local state, it doesn't call
  /// /auth/logout again.
  Future<void> handleSessionExpired() async {
    if (state.status != AuthStatus.authenticated) return;
    await ref.read(authRepositoryProvider).clearLocalSession();
    state = const AuthState(status: AuthStatus.unauthenticated);
    _invalidateUserScopedProviders();
  }

  /// Every no-argument (or small-domain-family) provider that fetches data
  /// scoped to "the current user" — without this, Riverpod keeps their last
  /// fetched value alive across a logout/login, so a second account signing
  /// in on the same device would see the *previous* account's cached wallet
  /// balance, notifications, etc. until each screen happened to invalidate
  /// itself for an unrelated reason. Called on both logout and successful
  /// login/OTP so a stale cache from before this session can never leak
  /// into it, in either direction.
  void _invalidateUserScopedProviders() {
    ref.invalidate(myWalletProvider);
    ref.invalidate(myWalletTransactionsProvider);
    ref.invalidate(myWithdrawalsControllerProvider);
    ref.invalidate(myNotificationsControllerProvider);
    ref.invalidate(unreadNotificationCountProvider);
    ref.invalidate(myDisputesControllerProvider);
    ref.invalidate(myOnDemandRequestsControllerProvider);
    ref.invalidate(myAssignmentsControllerProvider);
    ref.invalidate(myContractProjectsControllerProvider);
    ref.invalidate(myContractBidsControllerProvider);
    ref.invalidate(contractMilestonesControllerProvider);
    ref.invalidate(myRemoteEngagementsControllerProvider);
    ref.invalidate(remoteMilestonesControllerProvider);
    ref.invalidate(providerProfileControllerProvider);
    ref.invalidate(providerDocumentsControllerProvider);
    ref.invalidate(providerPortfolioControllerProvider);
    ref.invalidate(providerPayoutAccountsControllerProvider);
    ref.invalidate(companyProvider);
    ref.invalidate(companyControllerProvider);
    ref.invalidate(companyMembersControllerProvider);
    ref.invalidate(companyDocumentsControllerProvider);
    ref.invalidate(companySentInvitationsControllerProvider);
    ref.invalidate(myCompanyInvitationsControllerProvider);
    // Home layout is targeted per user — never show the previous account's.
    ref.invalidate(remoteConfigRepositoryProvider);
    ref.invalidate(homeLayoutProvider);
  }

  /// Re-fetches `/users/me` without touching tokens — used after a
  /// server-side change to the user's own record that this client doesn't
  /// otherwise learn about, e.g. accepting a company invitation changes
  /// `companyMembership` and therefore which Home shell (workspace) shows.
  Future<void> refreshCurrentUser() => _loadCurrentUser();

  Future<void> _loadCurrentUser() async {
    final result = await ref.read(authRepositoryProvider).fetchCurrentUser();
    state = result.when(
      success: (user) => AuthState(status: AuthStatus.authenticated, user: user),
      failure: (_) => const AuthState(status: AuthStatus.unauthenticated),
    );
    if (state.status == AuthStatus.authenticated) {
      _invalidateUserScopedProviders();
    }
  }
}

final authControllerProvider = NotifierProvider<AuthController, AuthState>(AuthController.new);
