enum OnDemandStatus { searching, assigned, enRoute, inProgress, completed, cancelled }

extension OnDemandStatusWire on OnDemandStatus {
  static OnDemandStatus fromWire(String value) {
    return switch (value) {
      'ASSIGNED' => OnDemandStatus.assigned,
      'EN_ROUTE' => OnDemandStatus.enRoute,
      'IN_PROGRESS' => OnDemandStatus.inProgress,
      'COMPLETED' => OnDemandStatus.completed,
      'CANCELLED' => OnDemandStatus.cancelled,
      _ => OnDemandStatus.searching,
    };
  }

  String get wireValue => switch (this) {
        OnDemandStatus.searching => 'SEARCHING',
        OnDemandStatus.assigned => 'ASSIGNED',
        OnDemandStatus.enRoute => 'EN_ROUTE',
        OnDemandStatus.inProgress => 'IN_PROGRESS',
        OnDemandStatus.completed => 'COMPLETED',
        OnDemandStatus.cancelled => 'CANCELLED',
      };

  bool get isActive => this != OnDemandStatus.completed && this != OnDemandStatus.cancelled;
}

enum FulfillmentMode { instant, scheduled }

extension FulfillmentModeWire on FulfillmentMode {
  String get wireValue => switch (this) {
        FulfillmentMode.instant => 'INSTANT',
        FulfillmentMode.scheduled => 'SCHEDULED',
      };
}

/// Mirrors apps/backend/src/domain/on-demand/on-demand-request.entity.ts.
class OnDemandRequest {
  const OnDemandRequest({
    required this.id,
    required this.categoryId,
    required this.description,
    required this.lat,
    required this.lng,
    required this.status,
    required this.fulfillmentMode,
    required this.isEmergency,
    required this.createdAt,
    this.scheduledFor,
  });

  factory OnDemandRequest.fromJson(Map<String, dynamic> json) {
    return OnDemandRequest(
      id: json['id'] as String,
      categoryId: json['categoryId'] as String,
      description: json['description'] as String,
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
      status: OnDemandStatusWire.fromWire(json['status'] as String),
      fulfillmentMode: json['fulfillmentMode'] == 'SCHEDULED' ? FulfillmentMode.scheduled : FulfillmentMode.instant,
      isEmergency: json['isEmergency'] as bool,
      createdAt: DateTime.parse(json['createdAt'] as String),
      scheduledFor: json['scheduledFor'] != null ? DateTime.parse(json['scheduledFor'] as String) : null,
    );
  }

  final String id;
  final String categoryId;
  final String description;
  final double lat;
  final double lng;
  final OnDemandStatus status;
  final FulfillmentMode fulfillmentMode;
  final bool isEmergency;
  final DateTime createdAt;
  final DateTime? scheduledFor;
}
