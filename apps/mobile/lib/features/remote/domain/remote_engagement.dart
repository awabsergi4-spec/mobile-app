enum RemoteEngagementStatus { active, delivered, completed, cancelled }

extension RemoteEngagementStatusWire on RemoteEngagementStatus {
  static RemoteEngagementStatus fromWire(String value) {
    return switch (value) {
      'DELIVERED' => RemoteEngagementStatus.delivered,
      'COMPLETED' => RemoteEngagementStatus.completed,
      'CANCELLED' => RemoteEngagementStatus.cancelled,
      _ => RemoteEngagementStatus.active,
    };
  }
}

enum PriceType { fixed, hourly }

extension PriceTypeWire on PriceType {
  String get wireValue => switch (this) {
        PriceType.fixed => 'FIXED',
        PriceType.hourly => 'HOURLY',
      };
}

/// Mirrors apps/backend/src/domain/remote/remote-engagement.entity.ts.
class RemoteEngagement {
  const RemoteEngagement({
    required this.id,
    required this.providerId,
    required this.categoryId,
    required this.title,
    required this.amount,
    required this.status,
    required this.createdAt,
  });

  factory RemoteEngagement.fromJson(Map<String, dynamic> json) {
    return RemoteEngagement(
      id: json['id'] as String,
      providerId: json['providerId'] as String,
      categoryId: json['categoryId'] as String,
      title: json['title'] as String,
      amount: (json['amount'] as num).toInt(),
      status: RemoteEngagementStatusWire.fromWire(json['status'] as String),
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  final String id;
  final String providerId;
  final String categoryId;
  final String title;
  final int amount;
  final RemoteEngagementStatus status;
  final DateTime createdAt;
}
