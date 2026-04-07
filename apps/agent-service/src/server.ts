import fastify from 'fastify';
import dotenv from 'dotenv';
import { apiRoutes } from './routes/api';
import { startSyncEngine } from './sync/cron';

dotenv.config();

const app = fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
    },
  },
});

// Health check endpoint (Observability)
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register API routes with prefix
app.register(apiRoutes, { prefix: '/api' });

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '4000', 10);
    const host = process.env.HOST || '0.0.0.0';
    
    // Start background jobs
    startSyncEngine();
    
    // Start Fastify server
    await app.listen({ port, host });
    
    app.log.info(`Agent Service running at http://${host}:${port}`);
    app.log.info('Ready to receive internal connections.');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
