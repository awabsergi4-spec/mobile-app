import '../../wallet/domain/withdrawal.dart';

/// Mirrors
/// apps/backend/src/domain/provider/provider-payout-account.repository.ts's
/// ProviderPayoutAccount. Reuses WithdrawalMethod from the wallet feature
/// rather than redeclaring the same wire enum.
class ProviderPayoutAccount {
  const ProviderPayoutAccount({
    required this.id,
    required this.providerId,
    required this.method,
    required this.accountDetails,
    required this.isDefault,
    required this.createdAt,
  });

  factory ProviderPayoutAccount.fromJson(Map<String, dynamic> json) {
    return ProviderPayoutAccount(
      id: json['id'] as String,
      providerId: json['providerId'] as String,
      method: WithdrawalMethodWire.fromWire(json['method'] as String),
      accountDetails: (json['accountDetails'] as Map<String, dynamic>?) ?? const {},
      isDefault: json['isDefault'] as bool,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  final String id;
  final String providerId;
  final WithdrawalMethod method;
  final Map<String, dynamic> accountDetails;
  final bool isDefault;
  final DateTime createdAt;
}
