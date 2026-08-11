import { prisma } from '../config/database';

export function calculateKpiScore(targetValue: number, actualValue: number) {
  if (targetValue === 0) return { score: 100, status: 'EXCELLENT' };
  
  const score = Math.min(Math.round((actualValue / targetValue) * 100 * 100) / 100, 150); // Cap at 150% max

  let status = 'NEEDS_ATTENTION';
  if (score >= 90) {
    status = 'EXCELLENT';
  } else if (score >= 75) {
    status = 'GOOD';
  } else if (score >= 50) {
    status = 'NEEDS_ATTENTION';
  } else {
    status = 'CRITICAL';
  }

  return { score, status };
}

export async function recalculateDirectorateKpiSummary(directorateId: string) {
  const kpis = await prisma.kPI.findMany({
    where: { directorateId },
  });

  if (kpis.length === 0) return { overallScore: 0, status: 'NEEDS_ATTENTION' };

  let totalWeight = 0;
  let weightedSum = 0;

  for (const kpi of kpis) {
    totalWeight += kpi.weight;
    weightedSum += (kpi.performanceScore * kpi.weight) / 100;
  }

  const overallScore = totalWeight > 0 ? Math.round((weightedSum / (totalWeight / 100)) * 100) / 100 : 0;

  let overallStatus = 'NEEDS_ATTENTION';
  if (overallScore >= 90) overallStatus = 'EXCELLENT';
  else if (overallScore >= 75) overallStatus = 'GOOD';
  else if (overallScore >= 50) overallStatus = 'NEEDS_ATTENTION';
  else overallStatus = 'CRITICAL';

  return {
    overallScore,
    overallStatus,
    kpisCount: kpis.length,
  };
}

/**
 * Automatically extracts metrics from a submitted report (Goal Achievement %, Financial Target/Achievement, Staff Headcount)
 * and updates/syncs the Directorate's KPI Target Tracker in real-time.
 */
export async function syncReportMetricsToKPIs(reportId: string) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { directorate: true },
  });
  if (!report || !report.dataJson) return;

  let parsed: any = {};
  try {
    parsed = typeof report.dataJson === 'string' ? JSON.parse(report.dataJson) : report.dataJson;
  } catch (err) {
    return;
  }

  const dir = report.directorate;
  if (!dir) return;

  // Category
  let category = await prisma.kPICategory.findFirst({
    where: { name: 'Operational Excellence' },
  });
  if (!category) {
    category = await prisma.kPICategory.create({
      data: {
        name: 'Operational Excellence',
        description: 'Tracked operational, financial, and headcount metrics from performance reports',
      },
    });
  }

  // 1. Goal Accomplishment Rate (%)
  const rawPct = parsed.percentageAchievement !== undefined 
    ? parseFloat(String(parsed.percentageAchievement).replace(/,/g, '')) 
    : 90;
  const pctVal = isNaN(rawPct) ? 90 : Math.min(Math.max(rawPct, 0), 150);
  const goalKpiScore = calculateKpiScore(100, pctVal);

  const goalCode = `KPI_GOAL_${dir.code}`;
  const goalKpi = await prisma.kPI.upsert({
    where: { code: goalCode },
    update: {
      targetValue: 100.0,
      currentValue: pctVal,
      performanceScore: goalKpiScore.score,
      status: goalKpiScore.status,
    },
    create: {
      name: `${dir.name} - Overall Goal Accomplishment`,
      code: goalCode,
      unit: '%',
      weight: 40.0,
      targetValue: 100.0,
      currentValue: pctVal,
      performanceScore: goalKpiScore.score,
      status: goalKpiScore.status,
      categoryId: category.id,
      directorateId: dir.id,
    },
  });

  try {
    await prisma.kPIResult.create({
      data: {
        kpiId: goalKpi.id,
        period: report.period || '2026-M08',
        actualValue: pctVal,
        targetValue: 100.0,
        score: goalKpiScore.score,
        remarks: `Tracked from form report: "${report.title}"`,
      },
    });
  } catch (_) {}

  // 2. Financial Target & Achievement (ESP)
  if (parsed.financialTarget !== undefined || parsed.financialAchievement !== undefined) {
    const rawTarget = parsed.financialTarget ? parseFloat(String(parsed.financialTarget).replace(/,/g, '')) : 0;
    const rawActual = parsed.financialAchievement ? parseFloat(String(parsed.financialAchievement).replace(/,/g, '')) : 0;
    const finTarget = isNaN(rawTarget) ? 0 : rawTarget;
    const finActual = isNaN(rawActual) ? 0 : rawActual;

    const finKpiScore = calculateKpiScore(finTarget, finActual);
    const finCode = `KPI_FIN_${dir.code}`;

    const finKpi = await prisma.kPI.upsert({
      where: { code: finCode },
      update: {
        targetValue: finTarget,
        currentValue: finActual,
        performanceScore: finKpiScore.score,
        status: finKpiScore.status,
      },
      create: {
        name: `${dir.name} - Financial Target & Revenue`,
        code: finCode,
        unit: 'ESP',
        weight: 35.0,
        targetValue: finTarget,
        currentValue: finActual,
        performanceScore: finKpiScore.score,
        status: finKpiScore.status,
        categoryId: category.id,
        directorateId: dir.id,
      },
    });

    try {
      await prisma.kPIResult.create({
        data: {
          kpiId: finKpi.id,
          period: report.period || '2026-M08',
          actualValue: finActual,
          targetValue: finTarget,
          score: finKpiScore.score,
          remarks: `Tracked from form report: "${report.title}"`,
        },
      });
    } catch (_) {}
  }

  // 3. Staff Headcount
  if (parsed.staffing?.headcount !== undefined || parsed.headcount !== undefined) {
    const rawHC = parsed.staffing?.headcount || parsed.headcount;
    const numHC = parseFloat(String(rawHC).replace(/,/g, ''));
    const hcVal = isNaN(numHC) ? 0 : numHC;

    const hcCode = `KPI_STAFF_${dir.code}`;
    const hcKpi = await prisma.kPI.upsert({
      where: { code: hcCode },
      update: {
        targetValue: hcVal,
        currentValue: hcVal,
        performanceScore: 100.0,
        status: 'EXCELLENT',
      },
      create: {
        name: `${dir.name} - Active Staff Headcount`,
        code: hcCode,
        unit: 'Staff',
        weight: 25.0,
        targetValue: hcVal,
        currentValue: hcVal,
        performanceScore: 100.0,
        status: 'EXCELLENT',
        categoryId: category.id,
        directorateId: dir.id,
      },
    });

    try {
      await prisma.kPIResult.create({
        data: {
          kpiId: hcKpi.id,
          period: report.period || '2026-M08',
          actualValue: hcVal,
          targetValue: hcVal,
          score: 100.0,
          remarks: `Tracked from form report: "${report.title}"`,
        },
      });
    } catch (_) {}
  }

  // Trigger directorate overall KPI score recalculation
  await recalculateDirectorateKpiSummary(dir.id);
}

/**
 * Bulk syncs all existing submitted reports to their respective directorate KPI trackers
 */
export async function syncAllReportsToKPIs() {
  const reports = await prisma.report.findMany({ select: { id: true } });
  for (const r of reports) {
    await syncReportMetricsToKPIs(r.id);
  }
}
