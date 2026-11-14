import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/utils/result.dart';
import '../domain/provider_document.dart';
import 'provider_controller.dart';

class ProviderDocumentsController extends AsyncNotifier<List<ProviderDocument>> {
  @override
  Future<List<ProviderDocument>> build() async {
    final result = await ref.read(providerRepositoryProvider).listDocuments();
    return result.when(success: (v) => v, failure: (f) => throw f);
  }

  Future<Result<ProviderDocument>> addDocument({required String type, required String fileUrl}) async {
    final result = await ref.read(providerRepositoryProvider).addDocument(type: type, fileUrl: fileUrl);
    if (result.isSuccess) {
      ref.invalidateSelf();
    }
    return result;
  }

  Future<Result<void>> submitVerification() async {
    final result = await ref.read(providerRepositoryProvider).submitVerification();
    if (result.isSuccess) {
      ref.invalidate(providerProfileControllerProvider);
    }
    return result;
  }
}

final providerDocumentsControllerProvider = AsyncNotifierProvider<ProviderDocumentsController, List<ProviderDocument>>(
  ProviderDocumentsController.new,
);
