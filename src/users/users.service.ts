import { prisma } from '../config/database';

export class UsersService {
  async listUsers(params: { search?: string; directorateId?: string; roleId?: string; status?: string; page?: number; limit?: number }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { email: { contains: params.search } },
        { kingschatUserId: { contains: params.search } },
      ];
    }
    if (params.directorateId) where.directorateId = params.directorateId;
    if (params.roleId) where.roleId = params.roleId;
    if (params.status) where.status = params.status;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          role: true,
          directorate: true,
          department: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
        directorate: true,
        department: true,
      },
    });
    if (!user) throw new Error('User not found');
    return user;
  }

  async updateUserRoleAndPlacement(userId: string, data: { roleId?: string; directorateId?: string; departmentId?: string; status?: string }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.roleId && { roleId: data.roleId }),
        ...(data.directorateId !== undefined && { directorateId: data.directorateId }),
        ...(data.departmentId !== undefined && { departmentId: data.departmentId }),
        ...(data.status && { status: data.status }),
      },
      include: {
        role: true,
        directorate: true,
        department: true,
      },
    });

    return updated;
  }

  async listRoles() {
    return prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
  }
}
