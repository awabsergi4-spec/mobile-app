import '../../../core/utils/result.dart';
import '../domain/account_type.dart';
import '../domain/current_user.dart';

/// Interface first — matches every other cross-cutting concern in this
/// codebase (RemoteConfigRepository, the backend's own PaymentProvider/
/// domain-ai pattern): the application/presentation layers depend on this,
/// never on AuthRepositoryImpl or ApiClient directly.
abstract interface class AuthRepository {
  /// Creates the account in PENDING approval state — no session is issued.
  /// An administrator approves it from the Admin Platform before the user
  /// can log in (login then fails with ACCOUNT_PENDING_APPROVAL until then).
  Future<Result<void>> register({
    required String phone,
    required String password,
    required String fullName,
    required String preferredLanguage,
    required AccountType accountType,
    String? email,
    String? businessName,
    String? companyName,
  });

  Future<Result<void>> login({required String phone, required String password});

  Future<Result<CurrentUser>> fetchCurrentUser();

  Future<void> logout();

  /// Whether a token pair is present locally — cheap, no network call.
  /// Session restoration uses this to decide whether it's even worth
  /// calling fetchCurrentUser().
  Future<bool> hasStoredSession();

  /// Clears local tokens without calling the backend logout endpoint —
  /// used when a session is known to already be invalid server-side (a
  /// failed refresh), where calling `/auth/logout` would be redundant.
  Future<void> clearLocalSession();
}
