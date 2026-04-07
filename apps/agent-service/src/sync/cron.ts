import cron from 'node-cron';
import { getLdapClient } from '../ldap/connector';
import { getCache } from '../cache';

export const startSyncEngine = () => {
  // Sync every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('[Sync Engine] Starting AD delta sync...');
    
    // In production, this would query Active Directory for changes using dirSync 
    // or uSNChanged attributes. For MVP, we will just mock a heartbeat log.
    try {
      const client = await getLdapClient();
      await client.unbind();
      console.log('[Sync Engine] AD Ping successful.');
      
      // TODO: Perform full/delta sync mapping AD -> Cache
      const cache = getCache();
      await cache.set('last_sync_time', new Date().toISOString());
    } catch (err) {
      console.error('[Sync Engine] AD Sync failed:', err);
    }
  });

  console.log('Cron scheduler initialized for AD Sync.');
};
