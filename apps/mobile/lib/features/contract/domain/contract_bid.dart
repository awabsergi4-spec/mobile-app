enum ContractBidStatus { submitted, accepted, rejected, withdrawn }

extension ContractBidStatusWire on ContractBidStatus {
  static ContractBidStatus fromWire(String value) {
    return switch (value) {
      'ACCEPTED' => ContractBidStatus.accepted,
      'REJECTED' => ContractBidStatus.rejected,
      'WITHDRAWN' => ContractBidStatus.withdrawn,
      _ => ContractBidStatus.submitted,
    };
  }
}

/// Mirrors apps/backend/src/domain/contract/contract-bid.repository.ts's
/// ContractBid entity.
class ContractBid {
  const ContractBid({
    required this.id,
    required this.projectId,
    required this.amount,
    required this.status,
    required this.submittedAt,
    this.message,
  });

  factory ContractBid.fromJson(Map<String, dynamic> json) {
    return ContractBid(
      id: json['id'] as String,
      projectId: json['projectId'] as String,
      amount: (json['amount'] as num).toInt(),
      status: ContractBidStatusWire.fromWire(json['status'] as String),
      submittedAt: DateTime.parse(json['submittedAt'] as String),
      message: json['message'] as String?,
    );
  }

  final String id;
  final String projectId;
  final int amount;
  final ContractBidStatus status;
  final DateTime submittedAt;
  final String? message;
}
