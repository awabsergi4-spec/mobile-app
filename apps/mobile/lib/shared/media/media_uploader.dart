import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/errors/app_failure.dart';
import '../../core/networking/api_call.dart';
import '../../core/networking/api_client.dart';
import '../../core/networking/providers.dart';
import '../../core/utils/result.dart';

/// What an upload is for: decides the Cloudinary folder and whether the file
/// is private (identity documents are never publicly reachable).
enum MediaPurpose {
  listing('listing'),
  avatar('avatar'),
  portfolio('portfolio'),
  document('document');

  const MediaPurpose(this.wire);
  final String wire;
}

/// Signed direct upload: the API signs, the file goes straight to
/// Cloudinary, and the returned URL is what we store.
class MediaUploader {
  MediaUploader(this._api);

  final ApiClient _api;
  final Dio _uploadDio = Dio(BaseOptions(connectTimeout: const Duration(seconds: 30), sendTimeout: const Duration(minutes: 2)));

  Future<Result<bool>> enabled() => apiCall(() async {
        final res = await _api.get('/uploads/status');
        return res.dataAsMap['enabled'] as bool? ?? false;
      });

  Future<Result<String>> upload(XFile file, MediaPurpose purpose) async {
    final signed = await apiCall(() async {
      final res = await _api.post('/uploads/signature', data: {'purpose': purpose.wire});
      return res.dataAsMap;
    });
    if (signed case Failure(:final failure)) return Result.failure(failure);
    final s = (signed as Success<Map<String, dynamic>>).value;
    try {
      final form = FormData.fromMap({
        'file': MultipartFile.fromBytes(await file.readAsBytes(), filename: file.name),
        'api_key': s['apiKey'],
        'timestamp': '${s['timestamp']}',
        'folder': s['folder'],
        if (s['type'] != null) 'type': s['type'],
        'signature': s['signature'],
      });
      final res = await _uploadDio.post<Map<String, dynamic>>(s['uploadUrl'] as String, data: form);
      final url = res.data?['secure_url'] as String?;
      if (url == null) return Result.failure(const UnknownFailure('Cloudinary returned no secure_url'));
      return Result.success(url);
    } on DioException catch (e) {
      final timeout = e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.sendTimeout ||
          e.type == DioExceptionType.receiveTimeout;
      if (timeout || e.type == DioExceptionType.connectionError) return Result.failure(NetworkFailure(isTimeout: timeout));
      return Result.failure(UnknownFailure(e));
    }
  }
}

final mediaUploaderProvider = Provider<MediaUploader>((ref) => MediaUploader(ref.watch(apiClientProvider)));

final uploadsEnabledStatusProvider = FutureProvider.autoDispose<bool>((ref) async {
  return unwrap(await ref.watch(mediaUploaderProvider).enabled());
});
