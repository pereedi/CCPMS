import { prisma } from '../config/database';

export class AuditService {
  async getAuditLogs(limit = 100) {
    return (prisma as any).auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
