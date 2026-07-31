import { Response } from 'express';
import { UsersService } from './users.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response';

const usersService = new UsersService();

export class UsersController {
  async listUsers(req: AuthRequest, res: Response) {
    try {
      const { search, directorateId, roleId, status, page, limit } = req.query;
      const result = await usersService.listUsers({
        search: search as string,
        directorateId: directorateId as string,
        roleId: roleId as string,
        status: status as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      });
      return sendSuccess(res, result.users, 'Users fetched successfully', 200, result.pagination);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async getUserById(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const user = await usersService.getUserById(id);
      return sendSuccess(res, user, 'User details retrieved');
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }

  async updateUser(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const { roleId, directorateId, departmentId, status } = req.body;
      const updated = await usersService.updateUserRoleAndPlacement(id, {
        roleId,
        directorateId,
        departmentId,
        status,
      });
      return sendSuccess(res, updated, 'User updated successfully');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async listRoles(req: AuthRequest, res: Response) {
    try {
      const roles = await usersService.listRoles();
      return sendSuccess(res, roles, 'Roles list retrieved');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }
}
