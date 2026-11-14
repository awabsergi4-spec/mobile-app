import type { AuditLogEntry } from "./audit-log.entity";

export interface SearchAuditLogFilter {
  actorId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  limit?: number;
  cursor?: string;
}

// Interface only — implemented in infrastructure/audit/prisma-audit-log-reader.ts.
// Read-only counterpart to AuditLogWriter — the admin Audit Logs UI is a
// pure observability surface, never a mutation surface (audit rows are
// append-only by design).
export interface AuditLogReader {
  search(filter: SearchAuditLogFilter): Promise<AuditLogEntry[]>;
}
