import 'company_role.dart';

/// Mirrors apps/backend/src/domain/company/company-member.repository.ts's
/// CompanyMember.
class CompanyMember {
  const CompanyMember({
    required this.id,
    required this.companyId,
    required this.userId,
    required this.role,
    required this.joinedAt,
  });

  factory CompanyMember.fromJson(Map<String, dynamic> json) {
    return CompanyMember(
      id: json['id'] as String,
      companyId: json['companyId'] as String,
      userId: json['userId'] as String,
      role: CompanyRoleWire.fromWire(json['role'] as String),
      joinedAt: DateTime.parse(json['joinedAt'] as String),
    );
  }

  final String id;
  final String companyId;
  final String userId;
  final CompanyRole role;
  final DateTime joinedAt;
}
