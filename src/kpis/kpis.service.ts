import { prisma } from '../config/database';
import { calculateKpiScore, recalculateDirectorateKpiSummary, syncAllReportsToKPIs } from './kpi-engine';

export class KPIService {
  async listCategories() {
    return prisma.kPICategory.findMany({
      include: { _count: { select: { kpis: true } } },
    });
  }

  async createCategory(data: { name: string; description?: string }) {
    return prisma.kPICategory.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });
  }

  async listKPIs(params: { directorateId?: string; categoryId?: string; search?: string }) {
    await syncAllReportsToKPIs();

    const where: any = {};
    if (params.directorateId) where.directorateId = params.directorateId;
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { code: { contains: params.search } },
      ];
    }

    return prisma.kPI.findMany({
      where,
      include: {
        category: true,
        directorate: true,
        department: true,
        results: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  async createKPI(data: {
    name: string;
    code: string;
    description?: string;
    unit: string;
    weight: number;
    targetValue: number;
    categoryId: string;
    directorateId: string;
    departmentId?: string;
  }) {
    const { score, status } = calculateKpiScore(data.targetValue, 0);

    return prisma.kPI.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description,
        unit: data.unit,
        weight: data.weight,
        targetValue: data.targetValue,
        currentValue: 0.0,
        performanceScore: score,
        status,
        categoryId: data.categoryId,
        directorateId: data.directorateId,
        departmentId: data.departmentId || null,
      },
    });
  }

  async recordKPIResult(kpiId: string, data: { actualValue: number; period: string; remarks?: string; submittedById?: string }) {
    const kpi = await prisma.kPI.findUnique({ where: { id: kpiId } });
    if (!kpi) throw new Error('KPI not found');

    const { score, status } = calculateKpiScore(kpi.targetValue, data.actualValue);

    // Save KPI result entry
    const resultEntry = await prisma.kPIResult.create({
      data: {
        kpiId,
        period: data.period,
        actualValue: data.actualValue,
        targetValue: kpi.targetValue,
        score,
        remarks: data.remarks,
        submittedById: data.submittedById,
      },
    });

    // Update KPI current value and calculated score
    const updatedKpi = await prisma.kPI.update({
      where: { id: kpiId },
      data: {
        currentValue: data.actualValue,
        performanceScore: score,
        status,
      },
    });

    // Trigger directorate score recalculation
    await recalculateDirectorateKpiSummary(kpi.directorateId);

    return { resultEntry, kpi: updatedKpi };
  }

  async getKpiDetails(id: string) {
    const kpi = await prisma.kPI.findUnique({
      where: { id },
      include: {
        category: true,
        directorate: true,
        department: true,
        targets: true,
        results: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!kpi) throw new Error('KPI not found');
    return kpi;
  }
}
