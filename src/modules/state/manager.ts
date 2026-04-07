import { getCache } from './cache';

export const StateManager = {
  async getLastSyncTime(): Promise<string | null> {
    const cache = getCache();
    return await cache.get('last_sync_time');
  },

  async setLastSyncTime(timestamp: string): Promise<void> {
    const cache = getCache();
    // Cache for 30 days or indefinitely
    await cache.set('last_sync_time', timestamp, 30 * 24 * 60 * 60);
  }
};
