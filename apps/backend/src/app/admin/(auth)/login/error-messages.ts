const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Incorrect phone number or password.",
  account_not_active: "This account isn't active.",
  pending_approval: "This account is still waiting for approval.",
  api_unreachable: "The SAHL API isn't reachable. Make sure it's running.",
  not_staff: "This account doesn't have Admin Platform access.",
  unknown: "Something went wrong. Please try again.",
};

export function adminLoginErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.unknown ?? null;
}
