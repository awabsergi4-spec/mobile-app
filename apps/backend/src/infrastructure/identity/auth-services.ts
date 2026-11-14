import { prisma } from "@/infrastructure/prisma-client";
import { PrismaUserRepository } from "./prisma-user.repository";
import { Argon2PasswordHasher } from "./argon2-password-hasher";
import { PrismaOtpRepository } from "./prisma-otp-repository";
import { PrismaRefreshTokenRepository } from "./prisma-refresh-token-repository";
import { PrismaStaffPermissionRepository } from "./prisma-staff-permission-repository";
import { ConsoleOtpSender } from "./console-otp-sender";
import { JwtTokenService } from "./jwt-token-service";
import { PrismaRemoteConfigReader } from "@/infrastructure/config/prisma-remote-config-reader";
import { SessionIssuer } from "@/application/identity/session-issuer";
import { SuspendUserUseCase } from "@/application/identity/suspend-user.use-case";
import { ReactivateUserUseCase } from "@/application/identity/reactivate-user.use-case";
import { auditLogWriter, domainEventPublisher } from "@/infrastructure/provider/provider-services";

// Wires the identity module's infrastructure once per process — every
// route handler imports from here instead of re-instantiating repositories
// per request, the same singleton convention as infrastructure/prisma-client.ts.
//
// JWT_PRIVATE_KEY/JWT_PUBLIC_KEY/ACCESS_TOKEN_TTL/REFRESH_TOKEN_TTL are
// already documented in .env.example — this throws loudly at import time
// if they're missing rather than silently issuing tokens with an empty key.
function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseDurationToSeconds(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) {
    throw new Error(`Invalid duration format: "${value}" (expected e.g. "15m", "30d")`);
  }
  const amount = Number(match[1]);
  const unitSeconds = { s: 1, m: 60, h: 3600, d: 86400 }[match[2] as "s" | "m" | "h" | "d"];
  return amount * unitSeconds;
}

const accessTokenTtlSeconds = parseDurationToSeconds(process.env.ACCESS_TOKEN_TTL ?? "15m");
const refreshTokenTtlSeconds = parseDurationToSeconds(process.env.REFRESH_TOKEN_TTL ?? "30d");

export const userRepository = new PrismaUserRepository(prisma);
export const passwordHasher = new Argon2PasswordHasher();
export const otpRepository = new PrismaOtpRepository(prisma);
export const refreshTokenRepository = new PrismaRefreshTokenRepository(prisma);
export const staffPermissionRepository = new PrismaStaffPermissionRepository(prisma);
export const otpSender = new ConsoleOtpSender();
export const remoteConfigReader = new PrismaRemoteConfigReader(prisma);

// Hosting dashboards (e.g. Render) pass env values through verbatim, so a
// PEM pasted on one line with literal "\n" escapes must be unescaped here —
// local .env loading does this automatically, platform env vars don't.
function pemFromEnv(name: string): string {
  return requiredEnv(name).replace(/\\n/g, "\n").trim();
}

export const tokenService = new JwtTokenService(
  pemFromEnv("JWT_PRIVATE_KEY"),
  pemFromEnv("JWT_PUBLIC_KEY"),
  accessTokenTtlSeconds,
);

export const sessionIssuer = new SessionIssuer(tokenService, refreshTokenRepository, refreshTokenTtlSeconds * 1000);

export const suspendUserUseCase = new SuspendUserUseCase(userRepository, auditLogWriter, domainEventPublisher);
export const reactivateUserUseCase = new ReactivateUserUseCase(userRepository, auditLogWriter, domainEventPublisher);
