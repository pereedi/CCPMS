import { prisma } from '../config/database';
import { RecordsService } from '../records/records.service';

const recordsSvc = new RecordsService();

export class ReviewsService {
  async createReview(data: {
    username:          string;
    reviewersUsername: string;
    report_url:        string;
    status?:           string;
  }) {
    return (prisma as any).review.create({
      data: {
        username:          data.username,
        reviewersUsername: data.reviewersUsername,
        report_url:        data.report_url,
        status:            data.status || 'PENDING',
      },
    });
  }

  async processExecutiveReview(data: {
    recordId:          string;
    reviewersUsername: string;
    action:            'APPROVE' | 'RETURN';
    comment?:          string;
  }) {
    const record = await (prisma as any).record.findUnique({ where: { id: data.recordId } });
    if (!record) throw new Error('Report record not found');

    const targetUsername = record.username;
    const newStatus = data.action === 'APPROVE' ? 'APPROVED' : 'RETURNED';

    // 1. Update Record status and append comment
    const commentObj = data.comment ? {
      by:        data.reviewersUsername,
      role:      'OFEM',
      message:   data.comment,
      createdAt: new Date().toISOString(),
    } : undefined;

    await recordsSvc.updateRecord(
      data.recordId,
      data.reviewersUsername,
      'OFEM',
      {
        status:   newStatus,
        comments: commentObj ? [commentObj] : undefined,
      },
    );

    // 2. Create or update Review entry
    const review = await (prisma as any).review.create({
      data: {
        username:          targetUsername,
        reviewersUsername: data.reviewersUsername,
        report_url:        `/records/${data.recordId}`,
        status:            newStatus,
        reviewedAt:        new Date(),
      },
    });

    // 3. Trigger Notification to AD
    try {
      const isReturned = data.action === 'RETURN';
      const notifTitle = isReturned
        ? `⚠️ Report Returned for Revision`
        : `✅ Report Approved by Executive Command`;
      const notifMessage = isReturned
        ? `OFEM has returned your report with comments: "${data.comment || 'Please review and resubmit.'}"`
        : `OFEM Executive Command has approved your submitted report.`;

      await (prisma as any).notification.create({
        data: {
          username:  targetUsername,
          title:     notifTitle,
          message:   notifMessage,
          type:      isReturned ? 'ALERT' : 'APPROVAL_REQUEST',
          read:      false,
          link:      `/submitted-reports`,
        },
      });
    } catch (e: any) {
      console.warn('[Notification] Failed to create notification for AD:', e.message);
    }

    // 4. Create Audit Log
    try {
      await (prisma as any).auditLog.create({
        data: {
          username:  data.reviewersUsername,
          action:    data.action === 'APPROVE' ? 'APPROVE_REPORT' : 'RETURN_REPORT',
          resource:  'Record',
          details:   JSON.stringify({ recordId: data.recordId, targetUser: targetUsername, comment: data.comment }),
          ipAddress: '127.0.0.1',
        },
      });
    } catch (e: any) {
      console.warn('[AuditLog] Failed to log review action:', e.message);
    }

    return review;
  }

  async getReviews(callerUsername: string, callerRole: 'OFEM' | 'AD') {
    return (prisma as any).review.findMany({
      where:   callerRole === 'OFEM' ? {} : { username: callerUsername },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateReviewStatus(id: string, status: 'APPROVED' | 'REJECTED' | 'RETURNED') {
    return (prisma as any).review.update({
      where: { id },
      data:  { status, reviewedAt: new Date() },
    });
  }
}
