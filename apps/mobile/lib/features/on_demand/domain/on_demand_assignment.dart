enum AssignmentStatus { offered, accepted, declined, expired }

extension AssignmentStatusWire on AssignmentStatus {
  static AssignmentStatus fromWire(String value) {
    return switch (value) {
      'ACCEPTED' => AssignmentStatus.accepted,
      'DECLINED' => AssignmentStatus.declined,
      'EXPIRED' => AssignmentStatus.expired,
      _ => AssignmentStatus.offered,
    };
  }
}

/// Mirrors apps/backend/src/domain/on-demand/on-demand-assignment.repository.ts's
/// OnDemandAssignment entity. `requestDescription`/`requestCategoryId`/
/// `requestIsEmergency` are only present on GET /on-demand/assignments/me
/// (see that route's comment) — it enriches each assignment with its
/// request's own fields, since a provider can't decide accept/decline from
/// an offer that doesn't say what the job actually is.
class OnDemandAssignment {
  const OnDemandAssignment({
    required this.id,
    required this.requestId,
    required this.status,
    required this.offeredAt,
    this.quotedPrice,
    this.requestDescription,
    this.requestCategoryId,
    this.requestIsEmergency = false,
  });

  factory OnDemandAssignment.fromJson(Map<String, dynamic> json) {
    return OnDemandAssignment(
      id: json['id'] as String,
      requestId: json['requestId'] as String,
      status: AssignmentStatusWire.fromWire(json['status'] as String),
      offeredAt: DateTime.parse(json['offeredAt'] as String),
      quotedPrice: (json['quotedPrice'] as num?)?.toInt(),
      requestDescription: json['requestDescription'] as String?,
      requestCategoryId: json['requestCategoryId'] as String?,
      requestIsEmergency: json['requestIsEmergency'] as bool? ?? false,
    );
  }

  final String id;
  final String requestId;
  final AssignmentStatus status;
  final DateTime offeredAt;
  final int? quotedPrice;
  final String? requestDescription;
  final String? requestCategoryId;
  final bool requestIsEmergency;
}
