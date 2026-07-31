import { prisma } from '../config/database';

export class DirectoratesService {
  async listDirectorates() {
    const directorates = await prisma.directorate.findMany({
      include: {
        organization: true,
        departments: true,
        reports: { take: 5, orderBy: { createdAt: 'desc' } },
        _count: {
          select: {
            users: true,
            projects: true,
            kpis: true,
            reports: true,
          },
        },
        kpis: {
          select: {
            weight: true,
            performanceScore: true,
          },
        },
      },
    });

    return directorates.map((dir) => {
      // Calculate weighted overall directorate score
      let totalWeight = 0;
      let weightedSum = 0;
      for (const kpi of dir.kpis) {
        totalWeight += kpi.weight;
        weightedSum += (kpi.performanceScore * kpi.weight) / 100;
      }
      const overallScore = totalWeight > 0 ? (weightedSum / (totalWeight / 100)) : 0;

      // Extract latest submitted report stats (headcount, achievement %, etc.)
      const latestReport = dir.reports.length > 0 ? dir.reports[0] : null;
      let latestReportData: any = {};
      if (latestReport && latestReport.dataJson) {
        try {
          latestReportData = typeof latestReport.dataJson === 'string' ? JSON.parse(latestReport.dataJson) : latestReport.dataJson;
        } catch (e) {
          latestReportData = {};
        }
      }

      return {
        id: dir.id,
        name: dir.name,
        code: dir.code,
        description: dir.description,
        organization: dir.organization,
        departments: dir.departments,
        departmentsCount: dir.departments.length,
        usersCount: dir._count.users,
        projectsCount: dir._count.projects,
        kpisCount: dir._count.kpis,
        reportsCount: dir._count.reports,
        overallScore: Math.round(overallScore * 100) / 100,
        latestReport: latestReport ? {
          title: latestReport.title,
          period: latestReport.period,
          percentageAchievement: latestReportData.percentageAchievement || 85,
          headcount: latestReportData.staffing?.headcount || dir._count.users,
          financialAchievement: latestReportData.financialAchievement || 0,
        } : null,
        createdAt: dir.createdAt,
      };
    });
  }

  async createDirectorate(data: { name: string; code: string; description?: string; organizationId?: string }) {
    let orgId = data.organizationId;
    if (!orgId) {
      const defaultOrg = await prisma.organization.findFirst();
      if (!defaultOrg) throw new Error('No organization exists');
      orgId = defaultOrg.id;
    }

    return prisma.directorate.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description,
        organizationId: orgId,
      },
    });
  }

  async deleteDirectorate(id: string) {
    const existing = await prisma.directorate.findUnique({ where: { id } });
    if (!existing) throw new Error('Directorate not found');

    return prisma.directorate.delete({
      where: { id },
    });
  }

  async getDirectorateById(id: string) {
    const directorate = await prisma.directorate.findUnique({
      where: { id },
      include: {
        organization: true,
        departments: true,
        users: { select: { id: true, name: true, email: true, role: true } },
        projects: true,
        kpis: { include: { category: true } },
        reports: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!directorate) throw new Error('Directorate not found');
    return directorate;
  }

  async createDepartment(data: { name: string; code: string; directorateId: string }) {
    return prisma.department.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        directorateId: data.directorateId,
      },
    });
  }
}
