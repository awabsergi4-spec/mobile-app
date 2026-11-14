enum RemoteMilestoneStatus { pending, inProgress, submitted, approved, paid }

extension RemoteMilestoneStatusWire on RemoteMilestoneStatus {
  static RemoteMilestoneStatus fromWire(String value) {
    return switch (value) {
      'IN_PROGRESS' => RemoteMilestoneStatus.inProgress,
      'SUBMITTED' => RemoteMilestoneStatus.submitted,
      'APPROVED' => RemoteMilestoneStatus.approved,
      'PAID' => RemoteMilestoneStatus.paid,
      _ => RemoteMilestoneStatus.pending,
    };
  }
}

/// Mirrors apps/backend/src/domain/remote/remote-milestone.repository.ts's
/// RemoteMilestone entity.
class RemoteMilestone {
  const RemoteMilestone({required this.id, required this.engagementId, required this.title, required this.amount, required this.status});

  factory RemoteMilestone.fromJson(Map<String, dynamic> json) {
    return RemoteMilestone(
      id: json['id'] as String,
      engagementId: json['engagementId'] as String,
      title: json['title'] as String,
      amount: (json['amount'] as num).toInt(),
      status: RemoteMilestoneStatusWire.fromWire(json['status'] as String),
    );
  }

  final String id;
  final String engagementId;
  final String title;
  final int amount;
  final RemoteMilestoneStatus status;

  String get statusWire => switch (status) {
        RemoteMilestoneStatus.pending => 'PENDING',
        RemoteMilestoneStatus.inProgress => 'IN_PROGRESS',
        RemoteMilestoneStatus.submitted => 'SUBMITTED',
        RemoteMilestoneStatus.approved => 'APPROVED',
        RemoteMilestoneStatus.paid => 'PAID',
      };
}
