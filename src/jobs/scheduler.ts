import cron from 'node-cron';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';

export function initializeScheduler() {
  logger.info('⏰ Initializing background job scheduler...');

  // 1. Daily midnight check for overdue milestones
  cron.schedule('0 0 * * *', async () => {
    logger.info('[Scheduler] Running daily milestone deadline audit...');
    try {
      const now = new Date();
      const overdueMilestones = await prisma.milestone.updateMany({
        where: {
          dueDate: { lt: now },
          status: 'PENDING',
        },
        data: {
          status: 'OVERDUE',
        },
      });
      logger.info(`[Scheduler] Marked ${overdueMilestones.count} milestones as OVERDUE.`);
    } catch (err: any) {
      logger.error('[Scheduler] Error in milestone deadline audit:', err.message);
    }
  });

  // 2. Hourly check for unreviewed report reminders
  cron.schedule('0 * * * *', async () => {
    logger.info('[Scheduler] Checking pending report approvals...');
  });
}
