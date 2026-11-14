export interface AuditLogEntry {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

// Interface only — implemented in infrastructure/audit/prisma-audit-log-writer.ts.
// First real writer for the AuditLog table (existed since early schema
// rounds but had no application-layer consumer until Production Phase 1.2's
// Suspend/Reactivate/Delete/Verification requirements needed one).
export interface AuditLogWriter {
  write(entry: AuditLogEntry): Promise<void>;
}
