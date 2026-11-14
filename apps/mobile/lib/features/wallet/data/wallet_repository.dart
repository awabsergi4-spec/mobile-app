import '../../../core/utils/result.dart';
import '../domain/wallet.dart';
import '../domain/wallet_transaction.dart';
import '../domain/withdrawal.dart';

abstract interface class WalletRepository {
  Future<Result<Wallet>> fetchMyWallet();
  Future<Result<List<WalletTransaction>>> listMyTransactions();

  Future<Result<List<Withdrawal>>> listMyWithdrawals();
  Future<Result<Withdrawal>> requestWithdrawal({required int amount, required WithdrawalMethod method});
}
