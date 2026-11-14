import 'package:sahl_mobile/core/errors/app_failure.dart';
import 'package:sahl_mobile/core/utils/result.dart';
import 'package:sahl_mobile/features/auth/data/auth_repository.dart';
import 'package:sahl_mobile/features/auth/domain/account_type.dart';
import 'package:sahl_mobile/features/auth/domain/current_user.dart';

/// Scriptable in-memory AuthRepository — every AuthController test
/// configures the exact outcome it needs (no real Dio/secure-storage
/// platform channel involved), matching the Fake-repository pattern
/// already used throughout the backend's own test suite.
class FakeAuthRepository implements AuthRepository {
  bool storedSession = false;
  Result<CurrentUser> currentUserResult = const Result.failure(UnauthorizedFailure());
  Result<void> registerResult = const Result.success(null);
  Result<void> loginResult = const Result.success(null);

  AccountType? lastRegisteredAccountType;
  String? lastRegisteredBusinessName;
  int logoutCallCount = 0;
  int clearLocalSessionCallCount = 0;

  @override
  Future<bool> hasStoredSession() async => storedSession;

  @override
  Future<Result<CurrentUser>> fetchCurrentUser() async => currentUserResult;

  @override
  Future<Result<void>> register({
    required String phone,
    required String password,
    required String fullName,
    required String preferredLanguage,
    required AccountType accountType,
    String? email,
    String? businessName,
    String? companyName,
  }) async {
    lastRegisteredAccountType = accountType;
    lastRegisteredBusinessName = businessName;
    return registerResult;
  }

  @override
  Future<Result<void>> login({required String phone, required String password}) async => loginResult;

  @override
  Future<void> logout() async {
    logoutCallCount++;
    storedSession = false;
  }

  @override
  Future<void> clearLocalSession() async {
    clearLocalSessionCallCount++;
    storedSession = false;
  }
}

const testUser = CurrentUser(
  id: 'user-1',
  phone: '+249900000000',
  fullName: 'Test User',
  preferredLanguage: 'en',
  status: 'ACTIVE',
);
