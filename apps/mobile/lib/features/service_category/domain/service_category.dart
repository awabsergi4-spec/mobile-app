enum ServiceType { onDemand, contract, remote }

extension ServiceTypeWire on ServiceType {
  String get wireValue => switch (this) {
        ServiceType.onDemand => 'ON_DEMAND',
        ServiceType.contract => 'CONTRACT',
        ServiceType.remote => 'REMOTE',
      };
}

/// Mirrors apps/backend/src/domain/service-category/service-category.entity.ts
/// — `name`/`description` already resolved server-side for the caller's
/// locale, so this client never picks a translation itself.
class ServiceCategory {
  const ServiceCategory({required this.id, required this.name, this.description});

  factory ServiceCategory.fromJson(Map<String, dynamic> json) {
    return ServiceCategory(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
    );
  }

  final String id;
  final String name;
  final String? description;
}
