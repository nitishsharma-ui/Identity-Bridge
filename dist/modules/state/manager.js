"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateManager = void 0;
const cache_1 = require("./cache");
exports.StateManager = {
    async getLastSyncTime() {
        const cache = (0, cache_1.getCache)();
        return await cache.get('last_sync_time');
    },
    async setLastSyncTime(timestamp) {
        const cache = (0, cache_1.getCache)();
        // Cache for 30 days or indefinitely
        await cache.set('last_sync_time', timestamp, 30 * 24 * 60 * 60);
    }
};
