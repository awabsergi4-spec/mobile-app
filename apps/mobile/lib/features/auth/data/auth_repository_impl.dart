import '../../../core/networking/api_client.dart';
import '../../../core/networking/app_failure_exception.dart';
import '../../../core/storage/secure_token_storage.dart';
import '../../../core/utils/result.dart';
import '../domain/account_type.dart';
import '../domain/current_user.dart';
import 'auth_repository.dart';

class AuthRepositoryImpl implements AuthRepository {
  AuthRepositoryImpl({required ApiClient apiClient, required SecureTokenStorage tokenStorage})
      : _apiClient = apiClient,
        _tokenStorage = tokenStorage;

  final ApiClient _apiClient;
  final SecureTokenStorage _tokenStorage;

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
    try {
      await _apiClient.post(
        '/auth/register',
        skipAuth: true,
        data: {
          'phone': phone,
          'password': password,
          'fullName': fullName,
          'preferredLanguage': preferredLanguage,
          'accountType': accountType.wireValue,
          if (email != null && email.isNotEmpty) 'email': email,
          if (businessName != null && businessName.isNotEmpty) 'businessName': businessName,
          if (companyName != null && companyName.isNotEmpty) 'companyName': companyName,
        },
      );
      return const Result.success(null);
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<void>> login({required String phone, required String password}) async {
    try {
      final response = await _apiClient.post(
        '/auth/login',
        skipAuth: true,
        data: {'phone': phone, 'password': password},
      );
      await _saveSessionFromResponse(response.dataAsMap);
      return const Result.success(null);
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<CurrentUser>> fetchCurrentUser() async {
    try {
      final response = await _apiClient.get('/users/me');
      return Result.success(CurrentUser.fromJson(response.dataAsMap));
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<void> logout() async {
    final refreshToken = await _tokenStorage.readRefreshToken();
    if (refreshToken != null) {
      try {
        await _apiClient.post('/auth/logout', skipAuth: true, data: {'refreshToken': refreshToken});
      } on AppFailureException {
        // Best-effort — the local session is cleared regardless, so an
        // already-invalid/expired refresh token here isn't a failure the
        // user needs to see.
      }
    }
    await _tokenStorage.clear();
  }

  @override
  Future<bool> hasStoredSession() async {
    final token = await _tokenStorage.readAccessToken();
    return token != null;
  }

  @override
  Future<void> clearLocalSession() => _tokenStorage.clear();

  Future<void> _saveSessionFromResponse(Map<String, dynamic> body) async {
    final accessToken = body['accessToken'] as String;
    final refreshToken = body['refreshToken'] as String;
    await _tokenStorage.saveSession(accessToken: accessToken, refreshToken: refreshToken);
  }
}
