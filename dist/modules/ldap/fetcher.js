"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchUsersDelta = exports.toGeneralizedTime = void 0;
const connector_1 = require("./connector");
// Formats JS Date to LDAP GeneralizedTime (YYYYMMDDHHMMSS.0Z)
// Example: 20260407100000.0Z
const toGeneralizedTime = (date) => {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}.0Z`;
};
exports.toGeneralizedTime = toGeneralizedTime;
const fetchUsersDelta = async (lastSyncTime) => {
    let client = null;
    try {
        client = await (0, connector_1.getLdapClient)();
        const baseDn = process.env.LDAP_BASE_DN || '';
        // Core User filter
        let filter = '(&(objectClass=user)(!(objectClass=computer)))';
        // Add delta filter if we have a last sync time
        if (lastSyncTime) {
            const generalizedTimeStr = (0, exports.toGeneralizedTime)(lastSyncTime);
            filter = `(&${filter}(whenChanged>=${generalizedTimeStr}))`;
        }
        const { searchEntries } = await client.search(baseDn, {
            filter,
            scope: 'sub',
            attributes: ['sAMAccountName', 'userPrincipalName', 'displayName', 'mail', 'memberOf', 'whenChanged'],
        });
        console.log(`[LDAP Fetcher] Found ${searchEntries.length} users with filter: ${filter}`);
        return searchEntries.map(entry => {
            let groups = [];
            if (entry.memberOf) {
                if (Array.isArray(entry.memberOf)) {
                    groups = entry.memberOf.map(g => String(g));
                }
                else {
                    groups = [String(entry.memberOf)];
                }
            }
            const username = entry.sAMAccountName?.toString() || '';
            let email = entry.userPrincipalName?.toString() || entry.mail?.toString() || '';
            // Transform sAMAccountName to email if explicit email doesn't exist
            if (!email && username) {
                const defaultDomain = process.env.DEFAULT_EMAIL_DOMAIN || 'smtc.test.com';
                email = `${username}@${defaultDomain}`;
            }
            return {
                username,
                email,
                name: entry.displayName?.toString() || '',
                groups,
                whenChanged: entry.whenChanged?.toString() || ''
            };
        }).filter(user => user.email && user.username); // Filter out system accounts without identities
    }
    finally {
        if (client) {
            await client.unbind();
        }
    }
};
exports.fetchUsersDelta = fetchUsersDelta;
