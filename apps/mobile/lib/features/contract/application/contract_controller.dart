import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/networking/providers.dart';
import '../../../core/utils/result.dart';
import '../data/contract_repository.dart';
import '../data/contract_repository_impl.dart';
import '../domain/contract_project.dart';

final contractRepositoryProvider = Provider<ContractRepository>((ref) {
  return ContractRepositoryImpl(apiClient: ref.watch(apiClientProvider));
});

class MyContractProjectsController extends AsyncNotifier<List<ContractProject>> {
  @override
  Future<List<ContractProject>> build() async {
    final result = await ref.read(contractRepositoryProvider).listMyProjects();
    return result.when(success: (v) => v, failure: (f) => throw f);
  }

  Future<Result<ContractProject>> create({
    required String categoryId,
    required String title,
    required String description,
    int? budgetMin,
    int? budgetMax,
  }) async {
    final result = await ref.read(contractRepositoryProvider).createProject(
          categoryId: categoryId,
          title: title,
          description: description,
          budgetMin: budgetMin,
          budgetMax: budgetMax,
        );
    if (result.isSuccess) {
      ref.invalidateSelf();
    }
    return result;
  }
}

final myContractProjectsControllerProvider = AsyncNotifierProvider<MyContractProjectsController, List<ContractProject>>(
  MyContractProjectsController.new,
);

final openContractProjectsProvider = FutureProvider((ref) async {
  final result = await ref.watch(contractRepositoryProvider).listOpenProjects();
  return result.when(success: (v) => v, failure: (f) => throw f);
});

final contractProjectDetailProvider = FutureProvider.family<ContractProject, String>((ref, id) async {
  final result = await ref.watch(contractRepositoryProvider).fetchProjectById(id);
  return result.when(success: (v) => v, failure: (f) => throw f);
});
