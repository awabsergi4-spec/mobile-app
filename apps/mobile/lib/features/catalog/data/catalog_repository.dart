import '../../../core/networking/api_call.dart';
import '../../../core/networking/api_client.dart';
import '../../../core/utils/result.dart';
import '../domain/catalog_models.dart';

/// Sort orders supported by `GET /explore/providers`.
enum ProviderSort { rating, jobs, newest }

/// Customer catalog: explore, category details, search, public provider
/// profiles, reviews, promotions (apps/api `routers/catalog.py`).
class CatalogRepository {
  CatalogRepository(this._api);

  final ApiClient _api;

  Future<Result<List<ProviderSummary>>> exploreProviders({
    String? categoryId,
    String? query,
    ProviderSort sort = ProviderSort.rating,
    bool remoteOnly = false,
    int limit = 30,
  }) =>
      apiCall(() async {
        final res = await _api.get('/explore/providers', queryParameters: {
          if (categoryId != null) 'categoryId': categoryId,
          if (query != null && query.trim().isNotEmpty) 'q': query.trim(),
          'sort': sort.name,
          if (remoteOnly) 'remoteOnly': 'true',
          'limit': '$limit',
        });
        return res.dataAsList.cast<Map<String, dynamic>>().map(ProviderSummary.fromJson).toList();
      });

  Future<Result<CategoryDetail>> categoryDetail(String id, String locale) => apiCall(() async {
        final res = await _api.get('/service-categories/$id', queryParameters: {'locale': locale});
        return CategoryDetail.fromJson(res.dataAsMap);
      });

  Future<Result<SearchResults>> search(String query, String locale) => apiCall(() async {
        final res = await _api.get('/search', queryParameters: {'q': query.trim(), 'locale': locale});
        return SearchResults.fromJson(res.dataAsMap);
      });

  Future<Result<ProviderPublicProfile>> providerProfile(String providerId, String locale) => apiCall(() async {
        final res = await _api.get('/providers/$providerId/profile', queryParameters: {'locale': locale});
        return ProviderPublicProfile.fromJson(res.dataAsMap);
      });

  Future<Result<List<ReviewEntry>>> providerReviews(String providerId) => apiCall(() async {
        final res = await _api.get('/providers/$providerId/reviews');
        return res.dataAsList.cast<Map<String, dynamic>>().map(ReviewEntry.fromJson).toList();
      });

  Future<Result<List<Promotion>>> activePromotions() => apiCall(() async {
        final res = await _api.get('/promotions');
        return res.dataAsList.cast<Map<String, dynamic>>().map(Promotion.fromJson).toList();
      });
}
