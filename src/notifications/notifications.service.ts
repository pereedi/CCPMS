import { prisma } from '../config/database';

export class NotificationsService {
  async getUserNotifications(username: string) {
    return (prisma as any).notification.findMany({
      where:   { username },
      orderBy: { createdAt: 'desc' },
      take:    50,
    });
  }

  async markAsRead(notificationId: string, username: string) {
    return (prisma as any).notification.updateMany({
      where: { id: notificationId, username },
      data:  { read: true },
    });
  }

  async markAllAsRead(username: string) {
    return (prisma as any).notification.updateMany({
      where: { username, read: false },
      data:  { read: true },
    });
  }
}
