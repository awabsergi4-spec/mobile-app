enum ContractStatus { inProgress, completed, disputed, cancelled }

extension ContractStatusWire on ContractStatus {
  static ContractStatus fromWire(String value) {
    return switch (value) {
      'COMPLETED' => ContractStatus.completed,
      'DISPUTED' => ContractStatus.disputed,
      'CANCELLED' => ContractStatus.cancelled,
      _ => ContractStatus.inProgress,
    };
  }
}

/// Mirrors apps/backend/src/domain/contract/contract.entity.ts — the
/// awarded contract, distinct from ContractProject (the open listing).
class Contract {
  const Contract({
    required this.id,
    required this.projectId,
    required this.totalAmount,
    required this.status,
    required this.startedAt,
  });

  factory Contract.fromJson(Map<String, dynamic> json) {
    return Contract(
      id: json['id'] as String,
      projectId: json['projectId'] as String,
      totalAmount: (json['totalAmount'] as num).toInt(),
      status: ContractStatusWire.fromWire(json['status'] as String),
      startedAt: DateTime.parse(json['startedAt'] as String),
    );
  }

  final String id;
  final String projectId;
  final int totalAmount;
  final ContractStatus status;
  final DateTime startedAt;
}
