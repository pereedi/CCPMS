import { prisma } from '../config/database';
import { recalculateDirectorateKpiSummary } from '../kpis/kpi-engine';

export class ReportsService {
  async createReport(data: {
    title: string;
    type: string;
    period: string;
    summary: string;
    dataJson?: string;
    directorateId?: string;
    authorId: string;
  }) {
    let dirId = data.directorateId;
    if (!dirId) {
      const author = await prisma.user.findUnique({ where: { id: data.authorId } });
      dirId = author?.directorateId || undefined;
    }
    if (!dirId) {
      const firstDir = await prisma.directorate.findFirst();
      dirId = firstDir?.id;
    }
    if (!dirId) throw new Error('No directorate found to associate report');

    return prisma.report.create({
      data: {
        title: data.title,
        type: data.type || 'MONTHLY',
        period: data.period,
        summary: data.summary,
        dataJson: data.dataJson || null,
        directorateId: dirId,
        authorId: data.authorId,
        status: 'SUBMITTED',
      },
    });
  }

  async submitReport(reportId: string, authorId: string) {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new Error('Report not found');
    if (report.authorId !== authorId && report.status !== 'DRAFT') {
      throw new Error('Only the author can submit a draft report');
    }

    const updated = await prisma.report.update({
      where: { id: reportId },
      data: { status: 'SUBMITTED' },
    });

    // Notify Directors in directorate
    const directors = await prisma.user.findMany({
      where: {
        directorateId: report.directorateId,
        role: { name: { in: ['DIRECTOR', 'SUPER_ADMIN'] } },
      },
    });

    for (const dir of directors) {
      await prisma.notification.create({
        data: {
          userId: dir.id,
          title: 'New Operational Report Submitted',
          message: `Report "${report.title}" submitted for review.`,
          type: 'APPROVAL_REQUEST',
          link: `/reports/${report.id}`,
        },
      });
    }

    return updated;
  }

  async reviewReport(reportId: string, managerId: string, action: 'APPROVE' | 'REJECT', comments?: string) {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new Error('Report not found');
    if (report.status !== 'SUBMITTED') {
      throw new Error(`Report cannot be reviewed in status: ${report.status}`);
    }

    const newStatus = action === 'APPROVE' ? 'MANAGER_APPROVED' : 'REJECTED';

    await prisma.reportApproval.create({
      data: {
        reportId,
        approverId: managerId,
        roleAtApproval: 'DIRECTOR',
        action: newStatus,
        comments,
      },
    });

    const updated = await prisma.report.update({
      where: { id: reportId },
      data: { status: newStatus },
    });

    if (newStatus === 'MANAGER_APPROVED') {
      // Notify Director
      const directors = await prisma.user.findMany({
        where: {
          directorateId: report.directorateId,
          role: { name: { in: ['DIRECTOR', 'SUPER_ADMIN'] } },
        },
      });

      for (const dir of directors) {
        await prisma.notification.create({
          data: {
            userId: dir.id,
            title: 'Report Ready for Director Approval',
            message: `Report "${report.title}" approved by Manager and pending your final approval.`,
            type: 'APPROVAL_REQUEST',
            link: `/reports/${report.id}`,
          },
        });
      }
    }

    return updated;
  }

  async approveReportByDirector(
    reportId: string,
    approverId: string,
    action: 'APPROVE' | 'REJECT',
    comments?: string,
    approverRole: string = 'SUPER_ADMIN'
  ) {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new Error('Report not found');

    const isApprove = action === 'APPROVE';
    const newStatus = isApprove ? (approverRole === 'SUPER_ADMIN' ? 'APPROVED' : 'DIRECTOR_APPROVED') : 'REJECTED';

    await prisma.reportApproval.create({
      data: {
        reportId,
        approverId,
        roleAtApproval: approverRole,
        action: isApprove ? 'APPROVED' : 'REJECTED',
        comments: comments || (isApprove ? 'Report approved.' : 'Report rejected.'),
      },
    });

    const updated = await prisma.report.update({
      where: { id: reportId },
      data: { status: newStatus },
    });

    // If Approved: Trigger automated KPI score calculation & Executive updates
    if (isApprove) {
      await recalculateDirectorateKpiSummary(report.directorateId);

      // Notify Author
      await prisma.notification.create({
        data: {
          userId: report.authorId,
          title: 'Report Approved!',
          message: `Your report "${report.title}" has been approved by ${approverRole === 'SUPER_ADMIN' ? 'the Super Admin' : 'the Directorate Director'}.`,
          type: 'INFO',
          link: `/reports/${report.id}`,
        },
      });
    } else {
      // Notify Author of Rejection
      await prisma.notification.create({
        data: {
          userId: report.authorId,
          title: 'Report Rejected',
          message: `Your report "${report.title}" was rejected by ${approverRole === 'SUPER_ADMIN' ? 'the Super Admin' : 'the Directorate Director'}. Reason: ${comments || 'No comment provided.'}`,
          type: 'ALERT',
          link: `/reports/${report.id}`,
        },
      });
    }

    return updated;
  }

  async listReports(params: { directorateId?: string; status?: string; type?: string; authorId?: string }) {
    const where: any = {};
    if (params.directorateId) where.directorateId = params.directorateId;
    if (params.status) where.status = params.status;
    if (params.type) where.type = params.type;
    if (params.authorId) where.authorId = params.authorId;

    return prisma.report.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, email: true, role: true } },
        directorate: true,
        approvals: { include: { approver: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getReportById(id: string) {
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        author: true,
        directorate: true,
        approvals: { include: { approver: true }, orderBy: { createdAt: 'asc' } },
        attachments: true,
      },
    });
    if (!report) throw new Error('Report not found');
    return report;
  }

  async updateReport(id: string, data: {
    title?: string;
    type?: string;
    period?: string;
    summary?: string;
    dataJson?: string;
    directorateId?: string;
  }) {
    const existing = await prisma.report.findUnique({ where: { id } });
    if (!existing) throw new Error('Report not found');

    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.type) updateData.type = data.type;
    if (data.period) updateData.period = data.period;
    if (data.summary) updateData.summary = data.summary;
    if (data.dataJson) updateData.dataJson = data.dataJson;
    if (data.directorateId) updateData.directorateId = data.directorateId;

    return prisma.report.update({
      where: { id },
      data: updateData,
    });
  }
}
