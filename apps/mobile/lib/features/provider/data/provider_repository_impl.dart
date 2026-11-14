import '../../../core/networking/api_client.dart';
import '../../../core/networking/app_failure_exception.dart';
import '../../../core/utils/result.dart';
import '../../wallet/domain/withdrawal.dart';
import '../domain/provider_document.dart';
import '../domain/provider_payout_account.dart';
import '../domain/provider_portfolio_item.dart';
import '../domain/provider_profile.dart';
import 'provider_repository.dart';

class ProviderRepositoryImpl implements ProviderRepository {
  ProviderRepositoryImpl({required ApiClient apiClient}) : _apiClient = apiClient;

  final ApiClient _apiClient;

  @override
  Future<Result<ProviderProfile>> fetchMyProfile() async {
    try {
      final response = await _apiClient.get('/providers/me');
      return Result.success(ProviderProfile.fromJson(response.dataAsMap));
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<void>> setAvailability(AvailabilityMode mode) async {
    try {
      await _apiClient.post('/providers/me/availability', data: {'mode': mode.wireValue});
      return const Result.success(null);
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<ProviderProfile>> updateProfile({
    String? businessName,
    String? bio,
    int? yearsOfExperience,
    List<String>? skills,
    double? travelDistanceKm,
    bool? remoteAvailable,
    bool? emergencyAvailable,
    String? emergencyContactName,
    String? emergencyContactPhone,
  }) async {
    try {
      final response = await _apiClient.patch('/providers/me', data: {
        if (businessName != null) 'businessName': businessName,
        if (bio != null) 'bio': bio,
        if (yearsOfExperience != null) 'yearsOfExperience': yearsOfExperience,
        if (skills != null) 'skills': skills,
        if (travelDistanceKm != null) 'travelDistanceKm': travelDistanceKm,
        if (remoteAvailable != null) 'remoteAvailable': remoteAvailable,
        if (emergencyAvailable != null) 'emergencyAvailable': emergencyAvailable,
        if (emergencyContactName != null) 'emergencyContactName': emergencyContactName,
        if (emergencyContactPhone != null) 'emergencyContactPhone': emergencyContactPhone,
      });
      return Result.success(ProviderProfile.fromJson(response.dataAsMap));
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<List<ProviderDocument>>> listDocuments() async {
    try {
      final response = await _apiClient.get('/providers/me/documents');
      return Result.success(response.dataAsList.cast<Map<String, dynamic>>().map(ProviderDocument.fromJson).toList());
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<ProviderDocument>> addDocument({required String type, required String fileUrl}) async {
    try {
      final response = await _apiClient.post('/providers/me/documents', data: {'type': type, 'fileUrl': fileUrl});
      return Result.success(ProviderDocument.fromJson(response.dataAsMap));
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<void>> submitVerification() async {
    try {
      await _apiClient.post('/providers/me/verification/submit');
      return const Result.success(null);
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<List<ProviderPortfolioItem>>> listPortfolio() async {
    try {
      final response = await _apiClient.get('/providers/me/portfolio');
      return Result.success(response.dataAsList.cast<Map<String, dynamic>>().map(ProviderPortfolioItem.fromJson).toList());
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<ProviderPortfolioItem>> addPortfolioItem({required String mediaUrl, String? title, String? description}) async {
    try {
      final response = await _apiClient.post('/providers/me/portfolio', data: {
        'mediaUrl': mediaUrl,
        if (title != null) 'title': title,
        if (description != null) 'description': description,
      });
      return Result.success(ProviderPortfolioItem.fromJson(response.dataAsMap));
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<void>> deletePortfolioItem(String id) async {
    try {
      await _apiClient.delete('/providers/me/portfolio/$id');
      return const Result.success(null);
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<List<ProviderPayoutAccount>>> listPayoutAccounts() async {
    try {
      final response = await _apiClient.get('/providers/me/payout-accounts');
      return Result.success(response.dataAsList.cast<Map<String, dynamic>>().map(ProviderPayoutAccount.fromJson).toList());
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<ProviderPayoutAccount>> addPayoutAccount({
    required WithdrawalMethod method,
    required Map<String, dynamic> accountDetails,
    bool? isDefault,
  }) async {
    try {
      final response = await _apiClient.post('/providers/me/payout-accounts', data: {
        'method': method.wireValue,
        'accountDetails': accountDetails,
        if (isDefault != null) 'isDefault': isDefault,
      });
      return Result.success(ProviderPayoutAccount.fromJson(response.dataAsMap));
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<void>> deletePayoutAccount(String id) async {
    try {
      await _apiClient.delete('/providers/me/payout-accounts/$id');
      return const Result.success(null);
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<void>> setDefaultPayoutAccount(String id) async {
    try {
      await _apiClient.post('/providers/me/payout-accounts/$id/default');
      return const Result.success(null);
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }
}
