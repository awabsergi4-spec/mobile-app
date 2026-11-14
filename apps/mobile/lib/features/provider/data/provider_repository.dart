import '../../../core/utils/result.dart';
import '../../wallet/domain/withdrawal.dart';
import '../domain/provider_document.dart';
import '../domain/provider_payout_account.dart';
import '../domain/provider_portfolio_item.dart';
import '../domain/provider_profile.dart';

abstract interface class ProviderRepository {
  Future<Result<ProviderProfile>> fetchMyProfile();
  Future<Result<void>> setAvailability(AvailabilityMode mode);
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
  });

  Future<Result<List<ProviderDocument>>> listDocuments();
  Future<Result<ProviderDocument>> addDocument({required String type, required String fileUrl});
  Future<Result<void>> submitVerification();

  Future<Result<List<ProviderPortfolioItem>>> listPortfolio();
  Future<Result<ProviderPortfolioItem>> addPortfolioItem({required String mediaUrl, String? title, String? description});
  Future<Result<void>> deletePortfolioItem(String id);

  Future<Result<List<ProviderPayoutAccount>>> listPayoutAccounts();
  Future<Result<ProviderPayoutAccount>> addPayoutAccount({
    required WithdrawalMethod method,
    required Map<String, dynamic> accountDetails,
    bool? isDefault,
  });
  Future<Result<void>> deletePayoutAccount(String id);
  Future<Result<void>> setDefaultPayoutAccount(String id);
}
