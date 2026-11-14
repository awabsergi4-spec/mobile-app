enum WalletBucket { available, pending, locked, reward, cashback, bonus, incentive }

extension WalletBucketWire on WalletBucket {
  static WalletBucket fromWire(String value) {
    return switch (value) {
      'PENDING' => WalletBucket.pending,
      'LOCKED' => WalletBucket.locked,
      'REWARD' => WalletBucket.reward,
      'CASHBACK' => WalletBucket.cashback,
      'BONUS' => WalletBucket.bonus,
      'INCENTIVE' => WalletBucket.incentive,
      _ => WalletBucket.available,
    };
  }
}

class WalletBalance {
  const WalletBalance({required this.bucket, required this.amount});

  factory WalletBalance.fromJson(Map<String, dynamic> json) {
    return WalletBalance(bucket: WalletBucketWire.fromWire(json['bucket'] as String), amount: (json['amount'] as num).toInt());
  }

  final WalletBucket bucket;
  final int amount;
}

/// Mirrors apps/backend/src/domain/finance/wallet-repository.ts's
/// WalletRecord, plus the `balances` array GET /wallets/me attaches.
class Wallet {
  const Wallet({required this.id, required this.currency, required this.isFrozen, required this.balances});

  factory Wallet.fromJson(Map<String, dynamic> json) {
    return Wallet(
      id: json['id'] as String,
      currency: json['currency'] as String,
      isFrozen: json['isFrozen'] as bool,
      balances: (json['balances'] as List<dynamic>).cast<Map<String, dynamic>>().map(WalletBalance.fromJson).toList(),
    );
  }

  final String id;
  final String currency;
  final bool isFrozen;
  final List<WalletBalance> balances;

  int get availableBalance =>
      balances.where((b) => b.bucket == WalletBucket.available).fold(0, (sum, b) => sum + b.amount);
}
