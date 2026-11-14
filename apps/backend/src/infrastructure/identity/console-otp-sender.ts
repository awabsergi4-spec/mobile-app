import type { OtpPurpose } from "@/domain/identity/otp-repository";
import type { OtpSender } from "@/domain/identity/otp-sender";

// The development default — genuinely functions (logs the code so a
// developer can complete the flow without a real SMS provider), not a
// stub that throws. Swap for a real infrastructure/identity/<provider>
// adapter once an SMS provider is selected (open item, docs/07-roadmap.md);
// OtpSender is the seam that swap goes through — no caller change needed.
export class ConsoleOtpSender implements OtpSender {
  async send(phone: string, code: string, purpose: OtpPurpose): Promise<void> {
    console.log(`[OTP] ${purpose} code for ${phone}: ${code}`);
  }
}
