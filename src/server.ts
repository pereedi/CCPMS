import { app } from './app';
import { ENV } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './config/database';
import { syncRosterToDatabase } from './config/authorized-users';

const PORT = ENV.PORT;

app.listen(PORT, async () => {
  logger.info('===================================================');
  logger.info(`🚀 CCPMS Command & Control Backend — port ${PORT}`);
  logger.info(`🌐 Environment: ${ENV.NODE_ENV}`);
  logger.info(`🔑 KingsChat SSO Dev Mock: ${ENV.DEV_MOCK_KINGSCHAT}`);
  logger.info('===================================================');

  try {
    await syncRosterToDatabase(prisma as any);
  } catch (err: any) {
    logger.warn(`[StartupSync] Roster sync warning: ${err.message}`);
  }
});
