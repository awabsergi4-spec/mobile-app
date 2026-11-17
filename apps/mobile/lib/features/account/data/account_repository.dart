import '../../../core/networking/api_call.dart';
import '../../../core/networking/api_client.dart';
import '../../../core/storage/secure_token_storage.dart';
import '../../../core/utils/result.dart';
import '../domain/account_models.dart';

/// The signed-in user's own account, support tickets and reviews.
class AccountRepository {
  AccountRepository(this._api, this._tokens);

  final ApiClient _api;
  final SecureTokenStorage _tokens;

  Future<Result<void>> updateProfile({
    String? fullName,
    String? email,
    String? bio,
    String? city,
    String? address,
    String? preferredLanguage,
  }) =>
      apiCall(() async {
        await _api.patch('/users/me', data: {
          if (fullName != null) 'fullName': fullName,
          if (email != null && email.isNotEmpty) 'email': email,
          if (bio != null) 'bio': bio,
          if (city != null) 'city': city,
          if (address != null) 'address': address,
          if (preferredLanguage != null) 'preferredLanguage': preferredLanguage,
        });
      });

  /// Changes the password. The API signs out every other device and returns
  /// a fresh session for this one, which is stored right away.
  /// Sets (or with null, removes) the profile picture.
  Future<Result<void>> updateProfilePicture(String? url) => apiCall(() async {
        await _api.patch('/users/me', data: {'profilePictureUrl': url});
      });

  Future<Result<void>> changePassword({required String currentPassword, required String newPassword}) => apiCall(() async {
        final res = await _api.post('/users/me/password', data: {'currentPassword': currentPassword, 'newPassword': newPassword});
        final data = res.dataAsMap;
        await _tokens.saveSession(accessToken: data['accessToken'] as String, refreshToken: data['refreshToken'] as String);
      });

  Future<Result<NotificationPrefs>> notificationPrefs() => apiCall(() async {
        final res = await _api.get('/users/me/notification-preferences');
        return NotificationPrefs.fromJson(res.dataAsMap);
      });

  Future<Result<NotificationPrefs>> saveNotificationPrefs(NotificationPrefs prefs) => apiCall(() async {
        final res = await _api.put('/users/me/notification-preferences', data: prefs.toJson());
        return NotificationPrefs.fromJson(res.dataAsMap);
      });

  Future<Result<List<SupportTicket>>> tickets() => apiCall(() async {
        final res = await _api.get('/support/tickets');
        return res.dataAsList.cast<Map<String, dynamic>>().map(SupportTicket.fromJson).toList();
      });

  Future<Result<SupportTicket>> ticket(String id) => apiCall(() async {
        final res = await _api.get('/support/tickets/$id');
        return SupportTicket.fromJson(res.dataAsMap);
      });

  Future<Result<SupportTicket>> openTicket({required String subject, required String message}) => apiCall(() async {
        final res = await _api.post('/support/tickets', data: {'subject': subject, 'message': message});
        return SupportTicket.fromJson(res.dataAsMap);
      });

  Future<Result<void>> replyTicket(String id, String body) => apiCall(() async {
        await _api.post('/support/tickets/$id/messages', data: {'body': body});
      });

  Future<Result<MyReview?>> myReviewForJob(ReviewJobType type, String jobId) => apiCall(() async {
        final res = await _api.get('/reviews/for-job', queryParameters: {'jobType': type.wireValue, 'jobId': jobId});
        return res.data == null ? null : MyReview.fromJson(res.dataAsMap);
      });

  Future<Result<void>> submitReview({required ReviewJobType type, required String jobId, required int rating, String? comment}) =>
      apiCall(() async {
        await _api.post('/reviews', data: {
          'jobType': type.wireValue,
          'jobId': jobId,
          'rating': rating,
          if (comment != null && comment.trim().isNotEmpty) 'comment': comment.trim(),
        });
      });
}
