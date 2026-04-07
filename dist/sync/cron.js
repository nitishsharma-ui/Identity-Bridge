"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startSyncEngine = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const engine_1 = require("../modules/sync/engine");
const startSyncEngine = () => {
    // Sync every 5 minutes
    node_cron_1.default.schedule('*/5 * * * *', async () => {
        await (0, engine_1.runDeltaSync)();
    });
    console.log('Cron scheduler initialized for AD Delta Sync Engine.');
};
exports.startSyncEngine = startSyncEngine;
