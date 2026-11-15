import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/errors/app_failure.dart';
import '../../../core/networking/api_call.dart';
import '../../../core/networking/api_client.dart';
import '../../../core/utils/result.dart';
import '../domain/listing_models.dart';

enum ListingSort { newest, rating, price }

/// Service listings: browse/order (customers), post/manage (providers) and
/// signed image uploads straight to Cloudinary.
class ListingRepository {
  ListingRepository(this._api);

  final ApiClient _api;

  // Separate client for Cloudinary: no auth headers, no API base URL.
  final Dio _uploadDio = Dio(BaseOptions(connectTimeout: const Duration(seconds: 30), sendTimeout: const Duration(minutes: 2)));

  Future<Result<List<ServiceListing>>> browse({
    String? categoryId,
    String? providerId,
    ListingSort sort = ListingSort.newest,
    required String locale,
  }) =>
      apiCall(() async {
        final res = await _api.get('/listings', queryParameters: {
          if (categoryId != null) 'categoryId': categoryId,
          if (providerId != null) 'providerId': providerId,
          'sort': sort.name,
          'locale': locale,
        });
        return res.dataAsList.cast<Map<String, dynamic>>().map(ServiceListing.fromJson).toList();
      });

  Future<Result<ServiceListing>> get(String id, String locale) => apiCall(() async {
        final res = await _api.get('/listings/$id', queryParameters: {'locale': locale});
        return ServiceListing.fromJson(res.dataAsMap);
      });

  Future<Result<List<ServiceListing>>> mine(String locale) => apiCall(() async {
        final res = await _api.get('/listings/mine', queryParameters: {'locale': locale});
        return res.dataAsList.cast<Map<String, dynamic>>().map(ServiceListing.fromJson).toList();
      });

  Future<Result<ServiceListing>> create(ListingDraft draft) => apiCall(() async {
        final res = await _api.post('/listings', data: draft.toJson());
        return ServiceListing.fromJson(res.dataAsMap);
      });

  Future<Result<ServiceListing>> update(String id, ListingDraft draft) => apiCall(() async {
        final res = await _api.put('/listings/$id', data: draft.toJson());
        return ServiceListing.fromJson(res.dataAsMap);
      });

  Future<Result<void>> pause(String id) => apiCall(() async => _api.post('/listings/$id/pause'));

  Future<Result<void>> resume(String id) => apiCall(() async => _api.post('/listings/$id/resume'));

  Future<Result<void>> delete(String id) => apiCall(() async => _api.delete('/listings/$id'));

  Future<Result<bool>> uploadsEnabled() => apiCall(() async {
        final res = await _api.get('/uploads/status');
        return res.dataAsMap['enabled'] as bool? ?? false;
      });

  /// Gets a signature from the API, then uploads [file] to Cloudinary and
  /// returns its secure URL.
  Future<Result<String>> uploadImage(XFile file) async {
    final signed = await apiCall(() async {
      final res = await _api.post('/uploads/signature', data: {'purpose': 'listing'});
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
