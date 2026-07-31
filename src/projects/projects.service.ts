import { prisma } from '../config/database';

export class ProjectsService {
  async listProjects(params: { directorateId?: string; status?: string; search?: string }) {
    const where: any = {};
    if (params.directorateId) where.directorateId = params.directorateId;
    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { code: { contains: params.search } },
      ];
    }

    return prisma.project.findMany({
      where,
      include: {
        directorate: true,
        department: true,
        manager: { select: { id: true, name: true, email: true } },
        _count: {
          select: { milestones: true, tasks: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createProject(data: {
    name: string;
    code: string;
    description?: string;
    budget: number;
    startDate?: string;
    endDate?: string;
    directorateId: string;
    departmentId?: string;
    managerId?: string;
  }) {
    return prisma.project.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description,
        budget: data.budget,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        directorateId: data.directorateId,
        departmentId: data.departmentId || null,
        managerId: data.managerId || null,
        status: 'IN_PROGRESS',
        progress: 0.0,
      },
    });
  }

  async getProjectById(id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        directorate: true,
        department: true,
        manager: true,
        milestones: { orderBy: { createdAt: 'asc' } },
        tasks: { include: { assignee: true }, orderBy: { createdAt: 'desc' } },
        budgets: true,
        attachments: true,
      },
    });
    if (!project) throw new Error('Project not found');
    return project;
  }

  async updateProject(id: string, data: { status?: string; progress?: number; spent?: number; description?: string }) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) throw new Error('Project not found');

    return prisma.project.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.progress !== undefined && { progress: data.progress }),
        ...(data.spent !== undefined && { spent: data.spent }),
        ...(data.description && { description: data.description }),
      },
    });
  }

  async addMilestone(projectId: string, data: { title: string; description?: string; dueDate?: string }) {
    return prisma.milestone.create({
      data: {
        projectId,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: 'PENDING',
      },
    });
  }

  async addTask(projectId: string, data: { title: string; description?: string; priority?: string; assigneeId?: string; dueDate?: string }) {
    return prisma.task.create({
      data: {
        projectId,
        title: data.title,
        description: data.description,
        priority: data.priority || 'MEDIUM',
        assigneeId: data.assigneeId || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: 'TODO',
      },
    });
  }
}
