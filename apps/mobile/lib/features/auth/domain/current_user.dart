/// Which home shell a user sees — derived server-side from real DB
/// relations (ProviderProfile / Company ownership / CompanyMember), never
/// guessed client-side. COMPANY > PROVIDER > CUSTOMER when a user has more
/// than one (see apps/backend/src/app/api/v1/users/me/route.ts).
enum UserWorkspace { customer, provider, company }

/// Mirrors the shape returned by `GET /api/v1/users/me` exactly (see
/// apps/backend/src/app/api/v1/users/me/route.ts) — passwordHash and any
/// other internal field never leaves the backend, so there's nothing to
/// strip here.
class CurrentUser {
  const CurrentUser({
    required this.id,
    required this.phone,
    required this.fullName,
    required this.preferredLanguage,
    required this.status,
    this.email,
    this.profilePictureUrl,
    this.providerProfileId,
    this.companyId,
  });

  factory CurrentUser.fromJson(Map<String, dynamic> json) {
    final providerProfile = json['providerProfile'] as Map<String, dynamic>?;
    final ownedCompanyId = json['ownedCompanyId'] as String?;
    final companyMembership = json['companyMembership'] as Map<String, dynamic>?;

    return CurrentUser(
      id: json['id'] as String,
      phone: json['phone'] as String,
      fullName: json['fullName'] as String,
      preferredLanguage: json['preferredLanguage'] as String,
      status: json['status'] as String,
      email: json['email'] as String?,
      profilePictureUrl: json['profilePictureUrl'] as String?,
      providerProfileId: providerProfile?['id'] as String?,
      companyId: ownedCompanyId ?? companyMembership?['companyId'] as String?,
    );
  }

  final String id;
  final String phone;
  final String fullName;
  final String preferredLanguage;
  final String status;
  final String? email;
  final String? profilePictureUrl;
  final String? providerProfileId;
  final String? companyId;

  UserWorkspace get workspace {
    if (companyId != null) return UserWorkspace.company;
    if (providerProfileId != null) return UserWorkspace.provider;
    return UserWorkspace.customer;
  }
}
