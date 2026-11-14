import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/networking/providers.dart';
import '../../../core/utils/result.dart';
import '../data/company_repository.dart';
import '../data/company_repository_impl.dart';
import '../domain/company.dart';

final companyRepositoryProvider = Provider<CompanyRepository>((ref) {
  return CompanyRepositoryImpl(apiClient: ref.watch(apiClientProvider));
});

/// Family-keyed by companyId — the Home shell already knows which company
/// from `CurrentUser.companyId` (see auth/domain/current_user.dart).
class CompanyController extends FamilyAsyncNotifier<Company, String> {
  @override
  Future<Company> build(String companyId) async {
    final result = await ref.read(companyRepositoryProvider).fetchById(companyId);
    return result.when(success: (c) => c, failure: (f) => throw f);
  }

  Future<Result<Company>> updateCompany({String? name, String? description, String? logoUrl}) async {
    final result = await ref
        .read(companyRepositoryProvider)
        .update(arg, name: name, description: description, logoUrl: logoUrl);
    if (result.isSuccess) {
      ref.invalidateSelf();
    }
    return result;
  }
}

final companyControllerProvider = AsyncNotifierProvider.family<CompanyController, Company, String>(
  CompanyController.new,
);

/// Kept as a plain FutureProvider alias for read-only call sites (e.g. the
/// Home shell card) that don't need the mutation methods above.
final companyProvider = FutureProvider.family<Company, String>((ref, companyId) {
  return ref.watch(companyControllerProvider(companyId).future);
});
