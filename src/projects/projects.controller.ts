import { Response } from 'express';
import { ProjectsService } from './projects.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response';

const projectsService = new ProjectsService();

export class ProjectsController {
  async listProjects(req: AuthRequest, res: Response) {
    try {
      const { directorateId, status, search } = req.query;
      const projects = await projectsService.listProjects({
        directorateId: directorateId as string,
        status: status as string,
        search: search as string,
      });
      return sendSuccess(res, projects, 'Projects list retrieved');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async createProject(req: AuthRequest, res: Response) {
    try {
      const { name, code, description, budget, startDate, endDate, directorateId, departmentId, managerId } = req.body;
      if (!name || !code || budget === undefined || !directorateId) {
        return sendError(res, 'Name, code, budget, and directorateId are required', 400);
      }
      const created = await projectsService.createProject({
        name,
        code,
        description,
        budget: parseFloat(budget),
        startDate,
        endDate,
        directorateId,
        departmentId,
        managerId,
      });
      return sendSuccess(res, created, 'Project created successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async getProjectById(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const project = await projectsService.getProjectById(id);
      return sendSuccess(res, project, 'Project details retrieved');
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }

  async updateProject(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const { status, progress, spent, description } = req.body;
      const updated = await projectsService.updateProject(id, {
        status,
        progress: progress !== undefined ? parseFloat(progress) : undefined,
        spent: spent !== undefined ? parseFloat(spent) : undefined,
        description,
      });
      return sendSuccess(res, updated, 'Project updated');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async addMilestone(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const { title, description, dueDate } = req.body;
      if (!title) return sendError(res, 'Milestone title is required', 400);
      const milestone = await projectsService.addMilestone(id, { title, description, dueDate });
      return sendSuccess(res, milestone, 'Milestone added', 201);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async addTask(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const { title, description, priority, assigneeId, dueDate } = req.body;
      if (!title) return sendError(res, 'Task title is required', 400);
      const task = await projectsService.addTask(id, { title, description, priority, assigneeId, dueDate });
      return sendSuccess(res, task, 'Task created', 201);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }
}
