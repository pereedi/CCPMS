import { prisma } from '../config/database';

export interface RecordPayload {
  type:        'MONTHLY' | 'QUARTERLY';
  period:      string;
  summary:     string;
  kpi_results: Array<{ indicator: string; target: number; actual: number }>;
  file_url:    string | null;
}

export class RecordsService {
  async createRecord(data: { username: string } & RecordPayload) {
    const { username, ...payload } = data;
    return (prisma as any).record.create({
      data: {
        username,
        records: JSON.stringify(payload),
      },
    });
  }

  async getRecords(callerUsername: string, callerRole: 'OFEM' | 'AD') {
    const rows = await (prisma as any).record.findMany({
      where:   callerRole === 'OFEM' ? {} : { username: callerUsername },
      orderBy: { submittedAt: 'desc' },
    });
    return rows.map(this.parse);
  }

  async getRecord(id: string, callerUsername: string, callerRole: 'OFEM' | 'AD') {
    const row = await (prisma as any).record.findUnique({ where: { id } });
    if (!row) return null;
    if (callerRole === 'AD' && row.username !== callerUsername) return null;  // scope enforcement
    return this.parse(row);
  }

  /** Attach a file URL to an existing record's payload. */
  async attachFileUrl(id: string, fileUrl: string) {
    const row = await (prisma as any).record.findUnique({ where: { id } });
    if (!row) throw new Error('Record not found');
    const payload = JSON.parse(row.records) as RecordPayload;
    payload.file_url = fileUrl;
    return (prisma as any).record.update({
      where: { id },
      data:  { records: JSON.stringify(payload) },
    });
  }

  private parse(row: any) {
    return {
      id:          row.id,
      username:    row.username,
      submittedAt: row.submittedAt,
      updatedAt:   row.updatedAt,
      ...JSON.parse(row.records),
    };
  }
}
