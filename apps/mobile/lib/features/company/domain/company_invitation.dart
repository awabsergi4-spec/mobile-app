import 'company_role.dart';

enum CompanyInvitationStatus { pending, accepted, rejected, expired, cancelled }

extension CompanyInvitationStatusWire on CompanyInvitationStatus {
  static CompanyInvitationStatus fromWire(String value) {
    return switch (value) {
      'ACCEPTED' => CompanyInvitationStatus.accepted,
      'REJECTED' => CompanyInvitationStatus.rejected,
      'EXPIRED' => CompanyInvitationStatus.expired,
      'CANCELLED' => CompanyInvitationStatus.cancelled,
      _ => CompanyInvitationStatus.pending,
    };
  }
}

/// Mirrors apps/backend/src/domain/company/company-invitation.repository.ts's
/// CompanyInvitation. `companyName` is only present on the "my invitations"
/// endpoint (GET /companies/invitations/mine), which enriches each
/// invitation server-side since CompanyInvitation itself only stores
/// companyId — null when read from a company-scoped listing instead.
class CompanyInvitation {
  const CompanyInvitation({
    required this.id,
    required this.companyId,
    required this.invitedPhone,
    required this.role,
    required this.status,
    required this.expiresAt,
    required this.createdAt,
    this.companyName,
  });

  factory CompanyInvitation.fromJson(Map<String, dynamic> json) {
    return CompanyInvitation(
      id: json['id'] as String,
      companyId: json['companyId'] as String,
      invitedPhone: json['invitedPhone'] as String,
      role: CompanyRoleWire.fromWire(json['role'] as String),
      status: CompanyInvitationStatusWire.fromWire(json['status'] as String),
      expiresAt: DateTime.parse(json['expiresAt'] as String),
      createdAt: DateTime.parse(json['createdAt'] as String),
      companyName: json['companyName'] as String?,
    );
  }

  final String id;
  final String companyId;
  final String invitedPhone;
  final CompanyRole role;
  final CompanyInvitationStatus status;
  final DateTime expiresAt;
  final DateTime createdAt;
  final String? companyName;
}
