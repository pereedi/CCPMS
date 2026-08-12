import { prisma } from '../config/database';
import { recalculateDirectorateKpiSummary, syncReportMetricsToKPIs } from '../kpis/kpi-engine';

export class ReportsService {
  private async resolveUserId(userIdOrHandle?: string): Promise<string> {
    if (userIdOrHandle) {
      // 1. Direct lookup by User ID
      const byId = await prisma.user.findUnique({ where: { id: userIdOrHandle } });
      if (byId) return byId.id;

      // 2. Lookup by handle/username/email or stripped user- prefix
      const cleanHandle = userIdOrHandle.replace(/^user-/, '');
      const byHandle = await prisma.user.findFirst({
        where: {
          OR: [
            { kingschatUserId: userIdOrHandle },
            { kingschatUserId: cleanHandle },
            { name: userIdOrHandle },
            { name: cleanHandle },
            { email: userIdOrHandle },
          ],
        },
      });
      if (byHandle) return byHandle.id;
    }

    // 3. Fall back to any active user
    const fallbackUser = await prisma.user.findFirst({ where: { status: 'ACTIVE' } });
    if (fallbackUser) return fallbackUser.id;

    // 4. Create default user if database has no active users
    let role = await prisma.role.findFirst({ where: { name: 'SUPER_ADMIN' } });
    if (!role) {
      role = await prisma.role.create({
        data: { name: 'SUPER_ADMIN', description: 'Super Admin' },
      });
    }

    const newUser = await prisma.user.create({
      data: {
        kingschatUserId: 'pereedi3161',
        name: 'pereedi3161',
        email: 'admin@ccpms.org',
        roleId: role.id,
        status: 'ACTIVE',
      },
    });
    return newUser.id;
  }

  private async resolveDirectorateId(dirIdOrCode?: string, authorId?: string): Promise<string> {
    if (dirIdOrCode && dirIdOrCode.trim().length > 0) {
      const existing = await prisma.directorate.findFirst({
        where: {
          OR: [
            { id: dirIdOrCode },
            { code: dirIdOrCode },
            { name: dirIdOrCode },
          ],
        },
      });
      if (existing) return existing.id;
    }

    if (authorId) {
      const author = await prisma.user.findUnique({ where: { id: authorId } });
      if (author?.directorateId) {
        const authorDir = await prisma.directorate.findUnique({ where: { id: author.directorateId } });
        if (authorDir) return authorDir.id;
      }
    }

    const firstDir = await prisma.directorate.findFirst();
    if (firstDir) return firstDir.id;

    let defaultOrg = await prisma.organization.findFirst();
    if (!defaultOrg) {
      defaultOrg = await prisma.organization.create({
        data: { name: 'CCPMS Central Command', code: 'CCPMS_MAIN' },
      });
    }

    const defaultDir = await prisma.directorate.create({
      data: {
        name: 'Technology & Digital Innovation',
        code: 'TECH_DIGITAL',
        description: 'Technology & Digital Innovation Directorate',
        organizationId: defaultOrg.id,
      },
    });
    return defaultDir.id;
  }

  async createReport(data: {
    title: string;
    type: string;
    period: string;
    summary: string;
    dataJson?: string;
    directorateId?: string;
    authorId: string;
  }) {
    const authorId = await this.resolveUserId(data.authorId);
    const directorateId = await this.resolveDirectorateId(data.directorateId, authorId);

    const newReport = await prisma.report.create({
      data: {
        title: data.title,
        type: data.type || 'MONTHLY',
        period: data.period,
        summary: data.summary,
        dataJson: data.dataJson || null,
        directorateId,
        authorId,
        status: 'DRAFT',
      },
    });

    await syncReportMetricsToKPIs(newReport.id);
    return newReport;
  }

  async submitReport(reportId: string, authorId: string) {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new Error('Report not found');

    // Always resolve to the real DB user UUID before comparing
    const resolvedAuthorId = await this.resolveUserId(authorId);

    if (report.status !== 'DRAFT') {
      throw new Error(`Report cannot be submitted in status: ${report.status}`);
    }
    if (report.authorId !== resolvedAuthorId) {
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

    const realManagerId = await this.resolveUserId(managerId);
    const newStatus = action === 'APPROVE' ? 'MANAGER_APPROVED' : 'REJECTED';

    await prisma.reportApproval.create({
      data: {
        reportId,
        approverId: realManagerId,
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

    const realApproverId = await this.resolveUserId(approverId);
    const isApprove = action === 'APPROVE';
    const newStatus = isApprove ? (approverRole === 'SUPER_ADMIN' ? 'APPROVED' : 'DIRECTOR_APPROVED') : 'REJECTED';

    await prisma.reportApproval.create({
      data: {
        reportId,
        approverId: realApproverId,
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

    const updated = await prisma.report.update({
      where: { id },
      data: updateData,
    });

    await syncReportMetricsToKPIs(updated.id);
    return updated;
  }
}
