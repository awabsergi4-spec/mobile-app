import type { OtpPurpose } from "./otp-repository";

// Interface only — no SMS provider is selected yet (open item,
// docs/07-roadmap.md), so this stays swappable. See
// infrastructure/identity/console-otp-sender.ts for the working
// development default.
export interface OtpSender {
  send(phone: string, code: string, purpose: OtpPurpose): Promise<void>;
}
