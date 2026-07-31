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
