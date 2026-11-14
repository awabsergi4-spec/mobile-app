/// Account type chosen at sign-up. PROVIDER also creates a provider profile
/// and COMPANY a company (owned by this user) — see `POST /auth/register`
/// in apps/api. Employees join a company through invitations instead.
enum AccountType {
  customer('CUSTOMER'),
  provider('PROVIDER'),
  company('COMPANY');

  const AccountType(this.wireValue);

  final String wireValue;
}
