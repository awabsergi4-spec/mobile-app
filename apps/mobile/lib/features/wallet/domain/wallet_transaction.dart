enum TransactionDirection { inbound, outbound }

/// Mirrors apps/backend/src/domain/finance/wallet-repository.ts's
/// WalletTransactionRecord.
class WalletTransaction {
  const WalletTransaction({
    required this.id,
    required this.type,
    required this.amount,
    required this.currency,
    required this.status,
    required this.direction,
    required this.createdAt,
  });

  factory WalletTransaction.fromJson(Map<String, dynamic> json) {
    return WalletTransaction(
      id: json['id'] as String,
      type: json['type'] as String,
      amount: (json['amount'] as num).toInt(),
      currency: json['currency'] as String,
      status: json['status'] as String,
      direction: json['direction'] == 'OUT' ? TransactionDirection.outbound : TransactionDirection.inbound,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  final String id;
  final String type;
  final int amount;
  final String currency;
  final String status;
  final TransactionDirection direction;
  final DateTime createdAt;
}
