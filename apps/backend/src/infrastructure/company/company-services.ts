import { prisma } from "@/infrastructure/prisma-client";
import { PrismaCompanyRepository } from "./prisma-company.repository";
import { PrismaCompanyMemberRepository } from "./prisma-company-member.repository";
import { PrismaCompanyInvitationRepository } from "./prisma-company-invitation.repository";
import { PrismaCompanyDocumentRepository } from "./prisma-company-document.repository";
import { auditLogWriter, domainEventPublisher } from "@/infrastructure/provider/provider-services";
import { CreateCompanyUseCase } from "@/application/company/create-company.use-case";
import { UpdateCompanyUseCase } from "@/application/company/update-company.use-case";
import { SuspendCompanyUseCase } from "@/application/company/suspend-company.use-case";
import { ReactivateCompanyUseCase } from "@/application/company/reactivate-company.use-case";
import { DeleteCompanyUseCase } from "@/application/company/delete-company.use-case";
import { SubmitCompanyVerificationUseCase } from "@/application/company/submit-company-verification.use-case";
import { ReviewCompanyVerificationUseCase } from "@/application/company/review-company-verification.use-case";
import { InviteCompanyMemberUseCase } from "@/application/company/invite-company-member.use-case";
import { AcceptCompanyInvitationUseCase } from "@/application/company/accept-company-invitation.use-case";
import { CancelCompanyInvitationUseCase } from "@/application/company/cancel-company-invitation.use-case";
import { RemoveCompanyMemberUseCase } from "@/application/company/remove-company-member.use-case";
import { UpdateCompanyMemberRoleUseCase } from "@/application/company/update-company-member-role.use-case";

// Wires the Company module's infrastructure once per process — same
// singleton convention as infrastructure/identity/auth-services.ts and
// infrastructure/provider/provider-services.ts. Reuses the Provider
// module's already-wired auditLogWriter/domainEventPublisher singletons
// (both are process-wide, stateless-per-call, and take no Company-specific
// config) rather than constructing duplicate instances.
export const companyRepository = new PrismaCompanyRepository(prisma);
export const companyMemberRepository = new PrismaCompanyMemberRepository(prisma);
export const companyInvitationRepository = new PrismaCompanyInvitationRepository(prisma);
export const companyDocumentRepository = new PrismaCompanyDocumentRepository(prisma);

export const createCompanyUseCase = new CreateCompanyUseCase(companyRepository, companyMemberRepository);
export const updateCompanyUseCase = new UpdateCompanyUseCase(companyRepository);
export const suspendCompanyUseCase = new SuspendCompanyUseCase(companyRepository, auditLogWriter, domainEventPublisher);
export const reactivateCompanyUseCase = new ReactivateCompanyUseCase(companyRepository, auditLogWriter, domainEventPublisher);
export const deleteCompanyUseCase = new DeleteCompanyUseCase(companyRepository, auditLogWriter, domainEventPublisher);
export const submitCompanyVerificationUseCase = new SubmitCompanyVerificationUseCase(
  companyRepository,
  companyDocumentRepository,
  domainEventPublisher,
);
export const reviewCompanyVerificationUseCase = new ReviewCompanyVerificationUseCase(
  companyRepository,
  auditLogWriter,
  domainEventPublisher,
);
export const inviteCompanyMemberUseCase = new InviteCompanyMemberUseCase(
  companyMemberRepository,
  companyInvitationRepository,
  domainEventPublisher,
);
export const acceptCompanyInvitationUseCase = new AcceptCompanyInvitationUseCase(
  companyInvitationRepository,
  companyMemberRepository,
  domainEventPublisher,
);
export const cancelCompanyInvitationUseCase = new CancelCompanyInvitationUseCase(
  companyInvitationRepository,
  companyMemberRepository,
);
export const removeCompanyMemberUseCase = new RemoveCompanyMemberUseCase(companyMemberRepository, auditLogWriter);
export const updateCompanyMemberRoleUseCase = new UpdateCompanyMemberRoleUseCase(companyMemberRepository, auditLogWriter);
