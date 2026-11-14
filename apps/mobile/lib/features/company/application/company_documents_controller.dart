import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/utils/result.dart';
import '../domain/company_document.dart';
import 'company_controller.dart';

/// Family-keyed by companyId. Documents + verification submission are
/// grouped together since submitting for review is only meaningful once
/// documents exist (backend rejects submission with
/// VERIFICATION_DOCUMENTS_REQUIRED otherwise).
class CompanyDocumentsController extends FamilyAsyncNotifier<List<CompanyDocument>, String> {
  @override
  Future<List<CompanyDocument>> build(String companyId) async {
    final result = await ref.read(companyRepositoryProvider).listDocuments(companyId);
    return result.when(success: (v) => v, failure: (f) => throw f);
  }

  Future<Result<CompanyDocument>> addDocument({required String type, required String fileUrl}) async {
    final result = await ref.read(companyRepositoryProvider).addDocument(arg, type: type, fileUrl: fileUrl);
    if (result.isSuccess) {
      ref.invalidateSelf();
    }
    return result;
  }

  Future<Result<void>> submitVerification() async {
    final result = await ref.read(companyRepositoryProvider).submitVerification(arg);
    if (result.isSuccess) {
      ref.invalidate(companyControllerProvider(arg));
    }
    return result;
  }
}

final companyDocumentsControllerProvider =
    AsyncNotifierProvider.family<CompanyDocumentsController, List<CompanyDocument>, String>(
  CompanyDocumentsController.new,
);
