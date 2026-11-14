enum ContractMilestoneStatus { pending, inProgress, submitted, approved, paid }

extension ContractMilestoneStatusWire on ContractMilestoneStatus {
  static ContractMilestoneStatus fromWire(String value) {
    return switch (value) {
      'IN_PROGRESS' => ContractMilestoneStatus.inProgress,
      'SUBMITTED' => ContractMilestoneStatus.submitted,
      'APPROVED' => ContractMilestoneStatus.approved,
      'PAID' => ContractMilestoneStatus.paid,
      _ => ContractMilestoneStatus.pending,
    };
  }
}

/// Mirrors apps/backend/src/domain/contract/contract-milestone.repository.ts's
/// ContractMilestone entity.
class ContractMilestone {
  const ContractMilestone({
    required this.id,
    required this.contractId,
    required this.title,
    required this.amount,
    required this.status,
    this.dueDate,
  });

  factory ContractMilestone.fromJson(Map<String, dynamic> json) {
    return ContractMilestone(
      id: json['id'] as String,
      contractId: json['contractId'] as String,
      title: json['title'] as String,
      amount: (json['amount'] as num).toInt(),
      status: ContractMilestoneStatusWire.fromWire(json['status'] as String),
      dueDate: json['dueDate'] != null ? DateTime.parse(json['dueDate'] as String) : null,
    );
  }

  final String id;
  final String contractId;
  final String title;
  final int amount;
  final ContractMilestoneStatus status;

  String get statusWire => switch (status) {
        ContractMilestoneStatus.pending => 'PENDING',
        ContractMilestoneStatus.inProgress => 'IN_PROGRESS',
        ContractMilestoneStatus.submitted => 'SUBMITTED',
        ContractMilestoneStatus.approved => 'APPROVED',
        ContractMilestoneStatus.paid => 'PAID',
      };
  final DateTime? dueDate;
}
