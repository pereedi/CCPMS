import { app } from './app';
import { ENV } from './config/env';
import { logger } from './utils/logger';
import { initializeScheduler } from './jobs/scheduler';

const PORT = ENV.PORT;

app.listen(PORT, () => {
  logger.info(`===================================================`);
  logger.info(`🚀 CCPMS Command & Control Backend running on port ${PORT}`);
  logger.info(`🌐 Environment: ${ENV.NODE_ENV}`);
  logger.info(`🔑 KingsChat SSO Dev Mock: ${ENV.DEV_MOCK_KINGSCHAT}`);
  logger.info(`===================================================`);

  initializeScheduler();
});
