import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/networking/api_call.dart';
import '../../../core/networking/api_client.dart';
import '../../../core/networking/providers.dart';
import '../../../core/utils/result.dart';

/// Admin-assisted password reset (apps/api `routers/password_reset.py`):
/// the user asks, SAHL support sends a 6-digit code, the user sets a new
/// password with it.
class PasswordResetRepository {
  PasswordResetRepository(this._api);

  final ApiClient _api;

  Future<Result<void>> request(String phone) =>
      apiCall(() async => _api.post('/auth/password-reset/request', data: {'phone': phone}));

  Future<Result<void>> confirm({required String phone, required String code, required String newPassword}) =>
      apiCall(() async => _api.post('/auth/password-reset/confirm', data: {
            'phone': phone,
            'code': code,
            'newPassword': newPassword,
          }));
}

final passwordResetRepositoryProvider =
    Provider<PasswordResetRepository>((ref) => PasswordResetRepository(ref.watch(apiClientProvider)));
