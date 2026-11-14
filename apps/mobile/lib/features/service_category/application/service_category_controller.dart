import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/locale_controller.dart';
import '../../../core/networking/providers.dart';
import '../data/service_category_repository.dart';
import '../data/service_category_repository_impl.dart';
import '../domain/service_category.dart';

final serviceCategoryRepositoryProvider = Provider<ServiceCategoryRepository>((ref) {
  return ServiceCategoryRepositoryImpl(apiClient: ref.watch(apiClientProvider));
});

final serviceCategoriesProvider = FutureProvider.family<List<ServiceCategory>, ServiceType>((ref, type) async {
  final locale = ref.watch(localeControllerProvider);
  final result = await ref.watch(serviceCategoryRepositoryProvider).listActive(type, locale.languageCode);
  return result.when(success: (categories) => categories, failure: (failure) => throw failure);
});
