import app from './src/app.js';
import { env } from './src/config/env.js';
import { logger } from './src/utils/logger.js';

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 QuickSure API Server running in [${env.NODE_ENV}] mode on port ${env.PORT}`);
  logger.info(`📡 Health check endpoint: http://localhost:${env.PORT}/api/health`);
});

// Graceful Shutdown Handlers
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received. Closing HTTP server gracefully...');
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received. Closing HTTP server gracefully...');
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
});

export default server;
