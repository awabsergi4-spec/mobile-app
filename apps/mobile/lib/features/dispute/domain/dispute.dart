enum DisputeStatus { open, underReview, resolved, rejected }

extension DisputeStatusWire on DisputeStatus {
  static DisputeStatus fromWire(String value) {
    return switch (value) {
      'UNDER_REVIEW' => DisputeStatus.underReview,
      'RESOLVED' => DisputeStatus.resolved,
      'REJECTED' => DisputeStatus.rejected,
      _ => DisputeStatus.open,
    };
  }
}

/// Mirrors apps/backend/src/domain/dispute/dispute-repository.ts's
/// DisputeRecord.
class Dispute {
  const Dispute({
    required this.id,
    required this.relatedEntityType,
    required this.relatedEntityId,
    required this.reason,
    required this.status,
    this.resolutionNotes,
  });

  factory Dispute.fromJson(Map<String, dynamic> json) {
    return Dispute(
      id: json['id'] as String,
      relatedEntityType: json['relatedEntityType'] as String,
      relatedEntityId: json['relatedEntityId'] as String,
      reason: json['reason'] as String,
      status: DisputeStatusWire.fromWire(json['status'] as String),
      resolutionNotes: json['resolutionNotes'] as String?,
    );
  }

  final String id;
  final String relatedEntityType;
  final String relatedEntityId;
  final String reason;
  final DisputeStatus status;
  final String? resolutionNotes;
}
