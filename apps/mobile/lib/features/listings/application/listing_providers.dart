import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/locale_controller.dart';
import '../../../core/networking/api_call.dart';
import '../../../core/networking/providers.dart';
import '../data/listing_repository.dart';
import '../domain/listing_models.dart';

final listingRepositoryProvider = Provider<ListingRepository>((ref) => ListingRepository(ref.watch(apiClientProvider)));

typedef ListingQuery = ({String? categoryId, String? providerId});

/// Published listings for a category or a provider.
final listingsProvider = FutureProvider.autoDispose.family<List<ServiceListing>, ListingQuery>((ref, q) async {
  final locale = ref.watch(localeControllerProvider).languageCode;
  return unwrap(await ref.watch(listingRepositoryProvider).browse(categoryId: q.categoryId, providerId: q.providerId, locale: locale));
});

final listingDetailProvider = FutureProvider.autoDispose.family<ServiceListing, String>((ref, id) async {
  final locale = ref.watch(localeControllerProvider).languageCode;
  return unwrap(await ref.watch(listingRepositoryProvider).get(id, locale));
});

/// The signed-in provider's own listings (all statuses).
final myListingsProvider = FutureProvider.autoDispose<List<ServiceListing>>((ref) async {
  final locale = ref.watch(localeControllerProvider).languageCode;
  return unwrap(await ref.watch(listingRepositoryProvider).mine(locale));
});

final uploadsEnabledProvider = FutureProvider.autoDispose<bool>((ref) async {
  return unwrap(await ref.watch(listingRepositoryProvider).uploadsEnabled());
});
