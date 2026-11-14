import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/locale_controller.dart';
import '../../../core/networking/api_call.dart';
import '../../../core/networking/providers.dart';
import '../data/catalog_repository.dart';
import '../domain/catalog_models.dart';

final catalogRepositoryProvider = Provider<CatalogRepository>((ref) => CatalogRepository(ref.watch(apiClientProvider)));

/// Query key for provider listings (records have value equality).
typedef ProviderQuery = ({String? categoryId, String? query, ProviderSort sort, bool remoteOnly});

final exploreProvidersProvider = FutureProvider.autoDispose.family<List<ProviderSummary>, ProviderQuery>((ref, q) async {
  return unwrap(await ref.watch(catalogRepositoryProvider).exploreProviders(
        categoryId: q.categoryId,
        query: q.query,
        sort: q.sort,
        remoteOnly: q.remoteOnly,
      ));
});

/// Top-rated providers for the customer Home tab.
final recommendedProvidersProvider = FutureProvider<List<ProviderSummary>>((ref) async {
  return unwrap(await ref.watch(catalogRepositoryProvider).exploreProviders(limit: 10));
});

final categoryDetailProvider = FutureProvider.autoDispose.family<CategoryDetail, String>((ref, id) async {
  final locale = ref.watch(localeControllerProvider).languageCode;
  return unwrap(await ref.watch(catalogRepositoryProvider).categoryDetail(id, locale));
});

final searchProvider = FutureProvider.autoDispose.family<SearchResults, String>((ref, query) async {
  final locale = ref.watch(localeControllerProvider).languageCode;
  return unwrap(await ref.watch(catalogRepositoryProvider).search(query, locale));
});

final providerProfileProvider = FutureProvider.autoDispose.family<ProviderPublicProfile, String>((ref, id) async {
  final locale = ref.watch(localeControllerProvider).languageCode;
  return unwrap(await ref.watch(catalogRepositoryProvider).providerProfile(id, locale));
});

final providerReviewsProvider = FutureProvider.autoDispose.family<List<ReviewEntry>, String>((ref, id) async {
  return unwrap(await ref.watch(catalogRepositoryProvider).providerReviews(id));
});

final activePromotionsProvider = FutureProvider<List<Promotion>>((ref) async {
  return unwrap(await ref.watch(catalogRepositoryProvider).activePromotions());
});
