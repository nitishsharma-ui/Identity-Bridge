import { fetchUsersDelta } from '../ldap/fetcher';
import { mapLdapUserToScim } from '../mapping/scim';
import { ScimClient } from '../idp/scim-client';
import { StateManager } from '../state/manager';

export const runDeltaSync = async () => {
  console.log('[Sync Engine] Beginning synchronization sequence...');
  const startTime = new Date();

  try {
    // 1. Fetch State (Last Sync Time)
    const lastSyncStr = await StateManager.getLastSyncTime();
    const lastSyncDate = lastSyncStr ? new Date(lastSyncStr) : null;
    
    console.log(`[Sync Engine] Last successful sync timestamp: ${lastSyncDate?.toISOString() || 'Never (Full Sync)'}`);

    // 2. Fetch Active Directory Delta
    const adUsers = await fetchUsersDelta(lastSyncDate);
    console.log(`[Sync Engine] Extracted ${adUsers.length} modified users from Active Directory.`);

    if (adUsers.length === 0) {
      console.log('[Sync Engine] No changes detected. Sync complete.');
      await StateManager.setLastSyncTime(startTime.toISOString());
      return { status: 'success', synced: 0 };
    }

    // 3. Push to Identity Provider
    const scimClient = new ScimClient();
    let successCount = 0;
    let failureCount = 0;
    const errors: any[] = [];

    for (const adUser of adUsers) {
      try {
        const scimPayload = mapLdapUserToScim(adUser);
        await scimClient.syncUser(scimPayload);
        successCount++;
      } catch (err: any) {
        failureCount++;
        errors.push({ user: adUser.username, message: err.message });
      }
    }

    console.log(`[Sync Engine] Complete. Success: ${successCount}, Failures: ${failureCount}`);

    // 4. Update State if completely successful or sufficiently successful
    if (failureCount === 0) {
      await StateManager.setLastSyncTime(startTime.toISOString());
      console.log(`[Sync Engine] State state advanced to ${startTime.toISOString()}`);
    } else {
      console.warn('[Sync Engine] Finishing with failures. Sync timestamp not advanced entirely to allow retry.');
    }

    return { status: 'completed', successCount, failureCount, errors };

  } catch (error) {
    console.error('[Sync Engine] Fatal synchronization error:', error);
    return { status: 'error', error };
  }
};
