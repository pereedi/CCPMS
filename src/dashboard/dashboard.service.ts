import { prisma } from '../config/database';
import { recalculateDirectorateKpiSummary } from '../kpis/kpi-engine';

export class DashboardService {
  async getExecutiveDashboard() {
    // 1. Fetch Directorates & calculate rankings
    const directorates = await prisma.directorate.findMany({
      include: {
        kpis: { select: { weight: true, performanceScore: true, status: true } },
        projects: { select: { id: true, name: true, status: true, budget: true, spent: true } },
      },
    });

    const directorateRankings = await Promise.all(
      directorates.map(async (dir) => {
        const summary = await recalculateDirectorateKpiSummary(dir.id);
        return {
          id: dir.id,
          name: dir.name,
          code: dir.code,
          score: summary.overallScore,
          status: summary.overallStatus,
          activeProjectsCount: dir.projects.filter((p) => p.status === 'IN_PROGRESS').length,
        };
      })
    );

    // Sort by score descending
    directorateRankings.sort((a, b) => b.score - a.score);

    // 2. People Score (Task execution completion rate)
    const totalTasks = await prisma.task.count();
    const completedTasks = await prisma.task.count({ where: { status: 'COMPLETED' } });
    const peopleScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100 * 100) / 100 : 85.0;

    // 3. Data Score (Report submission & approval rate)
    const totalReports = await prisma.report.count();
    const approvedReports = await prisma.report.count({ where: { status: 'DIRECTOR_APPROVED' } });
    const dataScore = totalReports > 0 ? Math.round((approvedReports / totalReports) * 100 * 100) / 100 : 90.0;

    // 4. Money Score (Budget efficiency)
    const projects = await prisma.project.findMany();
    let totalBudget = 0;
    let totalSpent = 0;
    for (const p of projects) {
      totalBudget += p.budget;
      totalSpent += p.spent;
    }
    const moneyScore = totalBudget > 0 ? Math.min(Math.round(((totalBudget - totalSpent) / totalBudget) * 100 * 100) / 100 + 50, 100) : 92.5;

    // 5. Organization Health Score
    const orgHealthScore = Math.round(((peopleScore * 0.3) + (dataScore * 0.3) + (moneyScore * 0.4)) * 100) / 100;

    // 6. Risk Alerts
    const criticalKPIs = await prisma.kPI.findMany({
      where: { status: 'CRITICAL' },
      include: { directorate: true },
    });

    const overdueMilestones = await prisma.milestone.findMany({
      where: { status: 'OVERDUE' },
      include: { project: true },
    });

    const riskAlerts = [
      ...criticalKPIs.map((k) => ({
        type: 'KPI_CRITICAL',
        title: `KPI Critical: ${k.name}`,
        description: `Current value (${k.currentValue} ${k.unit}) is below critical target (${k.targetValue} ${k.unit})`,
        entityId: k.id,
        directorate: k.directorate.name,
      })),
      ...overdueMilestones.map((m) => ({
        type: 'MILESTONE_OVERDUE',
        title: `Milestone Overdue: ${m.title}`,
        description: `Project milestone is past due date`,
        entityId: m.id,
        project: m.project.name,
      })),
    ];

    // 7. Active Projects & Budget summary
    const activeProjectsCount = projects.filter((p) => p.status === 'IN_PROGRESS').length;

    return {
      organizationHealth: {
        overallScore: orgHealthScore,
        peopleScore,
        dataScore,
        moneyScore,
      },
      directorateRankings,
      summaryMetrics: {
        totalDirectorates: directorates.length,
        activeProjectsCount,
        totalBudget,
        totalSpent,
      },
      riskAlerts,
    };
  }

  async getDirectorateDashboard(directorateId: string) {
    const directorate = await prisma.directorate.findUnique({
      where: { id: directorateId },
      include: {
        projects: { include: { manager: true } },
        kpis: { include: { category: true } },
        reports: { take: 5, orderBy: { createdAt: 'desc' } },
        users: { select: { id: true, name: true, role: true } },
      },
    });

    if (!directorate) throw new Error('Directorate not found');

    const kpiSummary = await recalculateDirectorateKpiSummary(directorateId);

    let totalBudget = 0;
    let totalSpent = 0;
    for (const p of directorate.projects) {
      totalBudget += p.budget;
      totalSpent += p.spent;
    }

    return {
      directorate: {
        id: directorate.id,
        name: directorate.name,
        code: directorate.code,
      },
      scoreSummary: kpiSummary,
      financials: {
        totalBudget,
        totalSpent,
        budgetUtilizationPercent: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100 * 100) / 100 : 0,
      },
      projects: directorate.projects,
      kpis: directorate.kpis,
      recentReports: directorate.reports,
      teamMembersCount: directorate.users.length,
    };
  }

  async getReportsAnalytics() {
    const reports = await prisma.report.findMany({
      include: {
        directorate: true,
        author: { select: { name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    let totalFinancialTarget = 0;
    let totalFinancialAchievement = 0;
    let totalAchievementPercent = 0;
    let countedReports = 0;

    const directorateStatsMap: Record<string, {
      name: string;
      code: string;
      reportsCount: number;
      avgAchievement: number;
      financialTarget: number;
      financialAchievement: number;
    }> = {};

    const parsedReports = reports.map((r) => {
      let parsedData: any = {};
      try {
        if (r.dataJson) {
          parsedData = typeof r.dataJson === 'string' ? JSON.parse(r.dataJson) : r.dataJson;
        }
      } catch (err) {
        parsedData = {};
      }

      const achievementPct = parsedData.percentageAchievement !== undefined 
        ? parseFloat(parsedData.percentageAchievement) 
        : 85;

      const fTarget = parsedData.financialTarget ? parseFloat(parsedData.financialTarget) : 0;
      const fAchieved = parsedData.financialAchievement ? parseFloat(parsedData.financialAchievement) : 0;

      totalFinancialTarget += fTarget;
      totalFinancialAchievement += fAchieved;
      totalAchievementPercent += achievementPct;
      countedReports++;

      const dirCode = r.directorate?.code || 'HQ';
      if (!directorateStatsMap[dirCode]) {
        directorateStatsMap[dirCode] = {
          name: r.directorate?.name || 'Central Command',
          code: dirCode,
          reportsCount: 0,
          avgAchievement: 0,
          financialTarget: 0,
          financialAchievement: 0,
        };
      }

      directorateStatsMap[dirCode].reportsCount++;
      directorateStatsMap[dirCode].avgAchievement += achievementPct;
      directorateStatsMap[dirCode].financialTarget += fTarget;
      directorateStatsMap[dirCode].financialAchievement += fAchieved;

      return {
        ...r,
        parsedData,
        achievementPct,
      };
    });

    // Average directorate stats
    const directorateStats = Object.values(directorateStatsMap).map((ds) => ({
      ...ds,
      avgAchievement: ds.reportsCount > 0 ? Math.round((ds.avgAchievement / ds.reportsCount) * 10) / 10 : 0,
    }));

    return {
      overview: {
        totalReportsCount: reports.length,
        avgAchievementPercent: countedReports > 0 ? Math.round((totalAchievementPercent / countedReports) * 10) / 10 : 85,
        totalFinancialTarget,
        totalFinancialAchievement,
      },
      directorateStats,
      reports: parsedReports,
    };
  }
}
