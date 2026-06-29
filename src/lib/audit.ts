import { auditRepository } from '@/repositories/prisma/audit.repository';

export interface AuditPayload {
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ARCHIVE' | 'RESTORE' | 'LOGIN' | 'LOGOUT' | 'APPROVE' | 'REJECT' | 'GENERATE_DOC' | 'NOTE_ADDED';
  oldValues?: any;
  newValues?: any;
  userId?: string;
  ipAddress?: string;
}

export const auditLogger = {
  logAction: async (payload: AuditPayload) => {
    try {
      await auditRepository.create({
        entityType: payload.entityType,
        entityId: payload.entityId,
        action: payload.action,
        oldValues: payload.oldValues ? payload.oldValues : undefined,
        newValues: payload.newValues ? payload.newValues : undefined,
        userId: payload.userId,
        ipAddress: payload.ipAddress || '127.0.0.1',
      });
    } catch (error) {
      console.error('Audit Logger Failed to write record:', error);
      // We explicitly do not throw here to prevent bringing down the main transaction/request
      // in case the audit log fails (unless strict compliance requires it).
    }
  },
};
