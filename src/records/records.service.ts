import { prisma } from '../config/database';

export interface RecordPayload {
  title?:       string;
  type:        'WEEKLY' | 'MONTHLY';
  period:      string;
  summary:     string;
  kpi_results?: Array<{ indicator: string; target: number; actual: number; unit?: string; score?: number }>;
  projects?:    Array<{ name: string; status: string; progress: number; budget?: number; spent?: number; milestones?: Array<{ title: string; status: string }> }>;
  file_url?:    string | null;
  status?:     'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'RETURNED';
  comments?:   Array<{ by: string; role: string; message: string; createdAt: string }>;
}

export class RecordsService {
  async createRecord(data: { username: string } & RecordPayload) {
    const { username, ...payloadData } = data;
    const payload: RecordPayload = {
      status:   'SUBMITTED',
      comments: [],
      ...payloadData,
    };

    const newRecord = await (prisma as any).record.create({
      data: {
        username,
        records: JSON.stringify(payload),
      },
    });

    // Create Audit Log entry
    try {
      await (prisma as any).auditLog.create({
        data: {
          username,
          action:    'SUBMIT_REPORT',
          resource:  'Record',
          details:   JSON.stringify({ recordId: newRecord.id, period: payload.period, type: payload.type }),
          ipAddress: '127.0.0.1',
        },
      });
    } catch (e: any) {
      console.warn('[AuditLog] Failed to log SUBMIT_REPORT:', e.message);
    }

    // Send Real-Time Notification to OFEM Executives
    try {
      const ofemUsers = ['pereedi', 'pst_joy'];
      for (const ofemUser of ofemUsers) {
        await (prisma as any).notification.create({
          data: {
            username:  ofemUser,
            title:     `📄 New Report Submitted`,
            message:   `AD @${username} submitted the ${payload.type} report for ${payload.title || payload.period}.`,
            type:      'REPORT_SUBMISSION',
            read:      false,
            link:      `/reports`,
          },
        });
      }
    } catch (e: any) {
      console.warn('[Notification] Failed to notify OFEM of new report:', e.message);
    }

    return this.parse(newRecord);
  }

  async updateRecord(id: string, callerUsername: string, callerRole: 'OFEM' | 'AD', updateData: Partial<RecordPayload>) {
    const row = await (prisma as any).record.findUnique({ where: { id } });
    if (!row) throw new Error('Record not found');

    // Only owner AD or OFEM can update
    if (callerRole === 'AD' && row.username !== callerUsername) {
      throw new Error('Unauthorized to update this report');
    }

    const currentPayload = JSON.parse(row.records) as RecordPayload;
    
    // Merge update data
    const updatedPayload: RecordPayload = {
      ...currentPayload,
      ...updateData,
      // If AD is resubmitting a RETURNED report, change status back to SUBMITTED
      status: callerRole === 'AD' && currentPayload.status === 'RETURNED' ? 'SUBMITTED' : (updateData.status || currentPayload.status || 'SUBMITTED'),
    };

    // If new comment provided, append to history
    if (updateData.comments && updateData.comments.length > 0) {
      updatedPayload.comments = [
        ...(currentPayload.comments || []),
        ...updateData.comments,
      ];
    }

    const updatedRow = await (prisma as any).record.update({
      where: { id },
      data:  {
        records: JSON.stringify(updatedPayload),
        updatedAt: new Date(),
      },
    });

    // Audit Log
    try {
      const actionName = callerRole === 'AD' ? 'EDIT_REPORT' : 'EXECUTIVE_UPDATE_REPORT';
      await (prisma as any).auditLog.create({
        data: {
          username:  callerUsername,
          action:    actionName,
          resource:  'Record',
          details:   JSON.stringify({ recordId: id, status: updatedPayload.status }),
          ipAddress: '127.0.0.1',
        },
      });
    } catch (e: any) {
      console.warn('[AuditLog] Failed to log record update:', e.message);
    }

    // Send Real-Time Notification to OFEM if updated by AD
    if (callerRole === 'AD') {
      try {
        const ofemUsers = ['pereedi', 'pst_joy'];
        const titleText = currentPayload.status === 'RETURNED'
          ? `📝 Report Corrected & Resubmitted`
          : `📝 Directorate Report Updated`;
        for (const ofemUser of ofemUsers) {
          await (prisma as any).notification.create({
            data: {
              username:  ofemUser,
              title:     titleText,
              message:   `AD @${callerUsername} updated the report for ${updatedPayload.title || updatedPayload.period}.`,
              type:      'REPORT_UPDATE',
              read:      false,
              link:      `/reports`,
            },
          });
        }
      } catch (e: any) {
        console.warn('[Notification] Failed to notify OFEM of report update:', e.message);
      }
    }

    return this.parse(updatedRow);
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
    const updatedRow = await (prisma as any).record.update({
      where: { id },
      data:  { records: JSON.stringify(payload) },
    });
    return this.parse(updatedRow);
  }

  private parse(row: any) {
    let parsedJson: any = {};
    try {
      parsedJson = JSON.parse(row.records);
    } catch {
      parsedJson = {};
    }
    return {
      id:          row.id,
      username:    row.username,
      submittedAt: row.submittedAt,
      updatedAt:   row.updatedAt,
      status:      parsedJson.status || 'SUBMITTED',
      ...parsedJson,
    };
  }
}
