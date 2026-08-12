import { app } from './app';
import { ENV } from './config/env';
import { logger } from './utils/logger';
import { initializeScheduler } from './jobs/scheduler';
import { prisma } from './config/database';
import { syncAuthorizedUsersToDatabase } from './config/authorized-users';

const PORT = ENV.PORT;

app.listen(PORT, async () => {
  logger.info(`===================================================`);
  logger.info(`🚀 CCPMS Command & Control Backend running on port ${PORT}`);
  logger.info(`🌐 Environment: ${ENV.NODE_ENV}`);
  logger.info(`🔑 KingsChat SSO Dev Mock: ${ENV.DEV_MOCK_KINGSCHAT}`);
  logger.info(`===================================================`);

  try {
    await syncAuthorizedUsersToDatabase(prisma);
  } catch (err: any) {
    logger.warn(`[StartupSync] User sync warning: ${err.message}`);
  }

  initializeScheduler();
});
