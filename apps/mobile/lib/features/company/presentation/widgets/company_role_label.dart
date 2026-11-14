import '../../../../core/l10n/generated/app_localizations.dart';
import '../../domain/company_role.dart';

String companyRoleText(AppLocalizations l10n, CompanyRole role) {
  return switch (role) {
    CompanyRole.owner => l10n.companyRoleOwner,
    CompanyRole.manager => l10n.companyRoleManager,
    CompanyRole.staff => l10n.companyRoleStaff,
  };
}
