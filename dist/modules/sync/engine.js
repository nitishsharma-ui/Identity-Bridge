"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDeltaSync = void 0;
const fetcher_1 = require("../ldap/fetcher");
const scim_1 = require("../mapping/scim");
const scim_client_1 = require("../idp/scim-client");
const manager_1 = require("../state/manager");
const runDeltaSync = async () => {
    console.log('[Sync Engine] Beginning synchronization sequence...');
    const startTime = new Date();
    try {
        // 1. Fetch State (Last Sync Time)
        const lastSyncStr = await manager_1.StateManager.getLastSyncTime();
        const lastSyncDate = lastSyncStr ? new Date(lastSyncStr) : null;
        console.log(`[Sync Engine] Last successful sync timestamp: ${lastSyncDate?.toISOString() || 'Never (Full Sync)'}`);
        // 2. Fetch Active Directory Delta
        const adUsers = await (0, fetcher_1.fetchUsersDelta)(lastSyncDate);
        console.log(`[Sync Engine] Extracted ${adUsers.length} modified users from Active Directory.`);
        if (adUsers.length === 0) {
            console.log('[Sync Engine] No changes detected. Sync complete.');
            await manager_1.StateManager.setLastSyncTime(startTime.toISOString());
            return { status: 'success', synced: 0 };
        }
        // 3. Push to Identity Provider
        const scimClient = new scim_client_1.ScimClient();
        let successCount = 0;
        let failureCount = 0;
        const errors = [];
        for (const adUser of adUsers) {
            try {
                const scimPayload = (0, scim_1.mapLdapUserToScim)(adUser);
                await scimClient.syncUser(scimPayload);
                successCount++;
            }
            catch (err) {
                failureCount++;
                errors.push({ user: adUser.username, message: err.message });
            }
        }
        console.log(`[Sync Engine] Complete. Success: ${successCount}, Failures: ${failureCount}`);
        // 4. Update State if completely successful or sufficiently successful
        if (failureCount === 0) {
            await manager_1.StateManager.setLastSyncTime(startTime.toISOString());
            console.log(`[Sync Engine] State state advanced to ${startTime.toISOString()}`);
        }
        else {
            console.warn('[Sync Engine] Finishing with failures. Sync timestamp not advanced entirely to allow retry.');
        }
        return { status: 'completed', successCount, failureCount, errors };
    }
    catch (error) {
        console.error('[Sync Engine] Fatal synchronization error:', error);
        return { status: 'error', error };
    }
};
exports.runDeltaSync = runDeltaSync;
