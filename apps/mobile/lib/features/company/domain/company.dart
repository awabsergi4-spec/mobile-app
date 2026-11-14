/// Mirrors apps/backend/src/domain/company/company.entity.ts — only the
/// fields the app currently renders (Home shell card + management screens).
class Company {
  const Company({
    required this.id,
    required this.name,
    required this.verificationStatus,
    required this.status,
    this.description,
    this.logoUrl,
  });

  factory Company.fromJson(Map<String, dynamic> json) {
    return Company(
      id: json['id'] as String,
      name: json['name'] as String,
      verificationStatus: json['verificationStatus'] as String,
      status: json['status'] as String,
      description: json['description'] as String?,
      logoUrl: json['logoUrl'] as String?,
    );
  }

  final String id;
  final String name;
  final String verificationStatus;
  final String status;
  final String? description;
  final String? logoUrl;
}
