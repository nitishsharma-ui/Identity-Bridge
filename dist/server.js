"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const api_1 = require("./routes/api");
const cron_1 = require("./sync/cron");
const engine_1 = require("./modules/sync/engine");
const manager_1 = require("./modules/state/manager");
// Load .env.local first, then fallback to .env
if (fs_1.default.existsSync('.env.local')) {
    dotenv_1.default.config({ path: '.env.local' });
}
dotenv_1.default.config();
const app = (0, fastify_1.default)({
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
app.register(api_1.apiRoutes, { prefix: '/api' });
// Manual Sync Trigger Endpoint
app.post('/sync/run', async () => {
    app.log.info('Manual synchronization triggered via Admin API.');
    const result = await (0, engine_1.runDeltaSync)();
    return result;
});
// Sync Status Endpoint
app.get('/sync/status', async () => {
    const lastSyncTime = await manager_1.StateManager.getLastSyncTime();
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
        (0, cron_1.startSyncEngine)();
        // Start Fastify server
        await app.listen({ port, host });
        app.log.info(`Agent Service running at http://${host}:${port}`);
        app.log.info('Ready to receive internal connections.');
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
start();
