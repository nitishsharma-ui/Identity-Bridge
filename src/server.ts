import fastify from 'fastify';
import dotenv from 'dotenv';
import fs from 'fs';
import { apiRoutes } from './routes/api';
import { startSyncEngine } from './sync/cron';
import { runDeltaSync } from './modules/sync/engine';
import { StateManager } from './modules/state/manager';

// Load .env.local first, then fallback to .env
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
}
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

// Manual Sync Trigger Endpoint
app.post('/sync/run', async () => {
  app.log.info('Manual synchronization triggered via Admin API.');
  const result = await runDeltaSync();
  return result;
});

// Sync Status Endpoint
app.get('/sync/status', async () => {
  const lastSyncTime = await StateManager.getLastSyncTime();
  return { 
    service: 'Active Directory Identity Bridge', 
    engine: 'SCIM Outbound',
    status: 'active', 
    lastSyncTime: lastSyncTime || 'Never (Pending Full Sync)' 
  };
});

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
