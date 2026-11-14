/// Mirrors CompanyRole in apps/backend/src/domain/company/company.entity.ts.
enum CompanyRole { owner, manager, staff }

extension CompanyRoleWire on CompanyRole {
  static CompanyRole fromWire(String value) {
    return switch (value) {
      'OWNER' => CompanyRole.owner,
      'MANAGER' => CompanyRole.manager,
      _ => CompanyRole.staff,
    };
  }

  String get wireValue => switch (this) {
        CompanyRole.owner => 'OWNER',
        CompanyRole.manager => 'MANAGER',
        CompanyRole.staff => 'STAFF',
      };
}
