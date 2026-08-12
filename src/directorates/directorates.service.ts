import { prisma } from '../config/database';

export class DirectoratesService {
  async listDirectorates() {
    let directorates = await prisma.directorate.findMany({
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

    if (directorates.length === 0) {
      const seedData = [
        {
          name: 'Technology & Digital Innovation',
          code: 'TECH_DIGITAL',
          description: 'Enterprise IT Systems, Cyber Security, Software Engineering & Cloud Platforms',
          depts: [
            { name: 'Enterprise Software & Architecture', code: 'DEPT_SOFT_ARCH' },
            { name: 'Cloud Infrastructure & DevOps', code: 'DEPT_CLOUD_OPS' },
            { name: 'Cyber Security & Threat Intelligence', code: 'DEPT_CYBER_SEC' },
          ],
        },
        {
          name: 'FinTech & Technology Products',
          code: 'FINTECH',
          description: 'Financial Technology, Payment Gateways, ESP Digital Products & Ledger Systems',
          depts: [
            { name: 'Digital Payments & Gateways', code: 'DEPT_PAYMENTS' },
            { name: 'Core Banking & Ledger Systems', code: 'DEPT_LEDGER' },
            { name: 'Financial Product Innovation', code: 'DEPT_FIN_INNOV' },
          ],
        },
        {
          name: 'Social Media, Platforms & Distribution',
          code: 'SOCIAL_MEDIA',
          description: 'Platform Distribution, Social Engagement, Network Delivery & Broadcast Streaming',
          depts: [
            { name: 'Network Distribution & CDN', code: 'DEPT_CDN_NET' },
            { name: 'Platform Community Management', code: 'DEPT_COMM_MGMT' },
            { name: 'Live Broadcast Streaming', code: 'DEPT_BROADCAST' },
          ],
        },
        {
          name: 'Citizen Engagement & Global Localization',
          code: 'CITIZEN_GLOBAL',
          description: 'Global Citizen Relations, Community Outreach, Regional Operations & Field Support',
          depts: [
            { name: 'Global Outreach & Citizen Relations', code: 'DEPT_OUTREACH' },
            { name: 'Regional Operations & Field Support', code: 'DEPT_REGIONAL_OPS' },
            { name: 'Multi-language Support & Local Engagement', code: 'DEPT_LOCAL_ENG' },
          ],
        },
        {
          name: 'Research, Data Intelligence & Governance',
          code: 'RESEARCH_DATA',
          description: 'Data Analytics, AI Intelligence, Machine Learning & Regulatory Governance',
          depts: [
            { name: 'Data Analytics & Business Intelligence', code: 'DEPT_BI_DATA' },
            { name: 'AI & Machine Learning Research', code: 'DEPT_AI_ML' },
            { name: 'Data Privacy & Regulatory Compliance', code: 'DEPT_COMPLIANCE' },
          ],
        },
        {
          name: 'Content & Media Production',
          code: 'CONTENT_MEDIA',
          description: 'Digital Media Production, Broadcast Services, Studio Recording & Creative Content',
          depts: [
            { name: 'Creative Studio & Video Production', code: 'DEPT_STUDIO_VID' },
            { name: 'Audio Engineering & Post-Production', code: 'DEPT_AUDIO_ENG' },
            { name: 'Digital Asset Publishing', code: 'DEPT_PUBLISHING' },
          ],
        },
        {
          name: 'Digital Asset Management & Language Services',
          code: 'DIGITAL_ASSETS',
          description: 'Digital Assets Archiving, Multilingual Translation Services & Language AI Systems',
          depts: [
            { name: 'Multilingual Translation Services', code: 'DEPT_TRANSLATION' },
            { name: 'Archival & Metadata Systems', code: 'DEPT_ARCHIVE' },
            { name: 'Language AI & Localization', code: 'DEPT_LANG_AI' },
          ],
        },
      ];

      try {
        let defaultOrg = await prisma.organization.findFirst();
        if (!defaultOrg) {
          defaultOrg = await prisma.organization.create({
            data: { name: 'CCPMS Central Command', code: 'CCPMS_MAIN' },
          });
        }

        for (const item of seedData) {
          const dir = await prisma.directorate.create({
            data: {
              name: item.name,
              code: item.code,
              description: item.description,
              organizationId: defaultOrg.id,
            },
          });

          for (const dept of item.depts) {
            await prisma.department.create({
              data: {
                name: dept.name,
                code: dept.code,
                directorateId: dir.id,
              },
            });
          }
        }

        directorates = await prisma.directorate.findMany({
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
      } catch (err: any) {
        console.warn('[DirectoratesService] Auto-seed failed:', err.message);
      }
    }

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
