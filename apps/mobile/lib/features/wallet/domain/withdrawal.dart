enum WithdrawalStatus { requested, pendingApproval, approved, rejected, processing, paid, failed }

extension WithdrawalStatusWire on WithdrawalStatus {
  static WithdrawalStatus fromWire(String value) {
    return switch (value) {
      'PENDING_APPROVAL' => WithdrawalStatus.pendingApproval,
      'APPROVED' => WithdrawalStatus.approved,
      'REJECTED' => WithdrawalStatus.rejected,
      'PROCESSING' => WithdrawalStatus.processing,
      'PAID' => WithdrawalStatus.paid,
      'FAILED' => WithdrawalStatus.failed,
      _ => WithdrawalStatus.requested,
    };
  }
}

enum WithdrawalMethod { bankTransfer, walletTransfer, mobileMoney }

extension WithdrawalMethodWire on WithdrawalMethod {
  static WithdrawalMethod fromWire(String value) {
    return switch (value) {
      'WALLET_TRANSFER' => WithdrawalMethod.walletTransfer,
      'MOBILE_MONEY' => WithdrawalMethod.mobileMoney,
      _ => WithdrawalMethod.bankTransfer,
    };
  }

  String get wireValue => switch (this) {
        WithdrawalMethod.bankTransfer => 'BANK_TRANSFER',
        WithdrawalMethod.walletTransfer => 'WALLET_TRANSFER',
        WithdrawalMethod.mobileMoney => 'MOBILE_MONEY',
      };
}

/// Mirrors apps/backend/src/domain/finance/withdrawal-repository.ts's
/// WithdrawalRecord.
class Withdrawal {
  const Withdrawal({
    required this.id,
    required this.amount,
    required this.currency,
    required this.method,
    required this.status,
    required this.requestedAt,
    this.rejectedReason,
  });

  factory Withdrawal.fromJson(Map<String, dynamic> json) {
    return Withdrawal(
      id: json['id'] as String,
      amount: (json['amount'] as num).toInt(),
      currency: json['currency'] as String,
      method: json['method'] as String,
      status: WithdrawalStatusWire.fromWire(json['status'] as String),
      requestedAt: DateTime.parse(json['requestedAt'] as String),
      rejectedReason: json['rejectedReason'] as String?,
    );
  }

  final String id;
  final int amount;
  final String currency;
  final String method;
  final WithdrawalStatus status;
  final DateTime requestedAt;
  final String? rejectedReason;
}
