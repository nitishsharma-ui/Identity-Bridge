import cron from 'node-cron';
import { runDeltaSync } from '../modules/sync/engine';

export const startSyncEngine = () => {
  // Sync every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    await runDeltaSync();
  });

  console.log('Cron scheduler initialized for AD Delta Sync Engine.');
};
