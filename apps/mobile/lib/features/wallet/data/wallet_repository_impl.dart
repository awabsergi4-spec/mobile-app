import '../../../core/networking/api_client.dart';
import '../../../core/networking/app_failure_exception.dart';
import '../../../core/utils/result.dart';
import '../domain/wallet.dart';
import '../domain/wallet_transaction.dart';
import '../domain/withdrawal.dart';
import 'wallet_repository.dart';

class WalletRepositoryImpl implements WalletRepository {
  WalletRepositoryImpl({required ApiClient apiClient}) : _apiClient = apiClient;

  final ApiClient _apiClient;

  @override
  Future<Result<Wallet>> fetchMyWallet() async {
    try {
      final response = await _apiClient.get('/wallets/me');
      return Result.success(Wallet.fromJson(response.dataAsMap));
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<List<WalletTransaction>>> listMyTransactions() async {
    try {
      final response = await _apiClient.get('/wallets/me/transactions');
      return Result.success(response.dataAsList.cast<Map<String, dynamic>>().map(WalletTransaction.fromJson).toList());
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<List<Withdrawal>>> listMyWithdrawals() async {
    try {
      final response = await _apiClient.get('/providers/me/withdrawals');
      return Result.success(response.dataAsList.cast<Map<String, dynamic>>().map(Withdrawal.fromJson).toList());
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<Withdrawal>> requestWithdrawal({required int amount, required WithdrawalMethod method}) async {
    try {
      final response = await _apiClient.post('/providers/me/withdrawals', data: {'amount': amount, 'method': method.wireValue});
      return Result.success(Withdrawal.fromJson(response.dataAsMap));
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }
}
