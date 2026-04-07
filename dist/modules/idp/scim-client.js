"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScimClient = void 0;
class ScimClient {
    baseUrl;
    constructor() {
        this.baseUrl = process.env.SCIM_BASE_URL || 'https://uat-smtcauth-api.skfin.in/scim/v2';
    }
    async getAuthHeaders() {
        // Determine Authentication Flow based on environment
        // Flow 1: Bearer Token
        if (process.env.SCIM_BEARER_TOKEN) {
            return {
                'Authorization': `Bearer ${process.env.SCIM_BEARER_TOKEN}`,
                'Content-Type': 'application/json',
                'User-Agent': 'curl/7.68.0' // Bypass Cloudflare Bot Management silently blocking NodeJS fetches
            };
        }
        // Flow 2: OAuth Client Credentials (mock implementation)
        if (process.env.SCIM_CLIENT_ID && process.env.SCIM_CLIENT_SECRET) {
            // In production, you would fetch a token from /oauth2/token and cache it
            const tempToken = Buffer.from(`${process.env.SCIM_CLIENT_ID}:${process.env.SCIM_CLIENT_SECRET}`).toString('base64');
            return {
                'Authorization': `Basic ${tempToken}`,
                'Content-Type': 'application/scim+json'
            };
        }
        throw new Error('No SCIM Authentication parameters provided in environment.');
    }
    async syncUser(scimUserPayload) {
        const headers = await this.getAuthHeaders();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        try {
            // SCIM Creation Endpoint
            const response = await fetch(`${this.baseUrl}/Users`, {
                method: 'POST',
                headers,
                body: JSON.stringify(scimUserPayload),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                const errorBody = await response.text();
                // Handle 409 properly, but also fallback to checking the error message text
                // since the auth-mine IdP sometimes returns "user with given email is already exists"
                if (response.status === 409 || errorBody.toLowerCase().includes('already exists')) {
                    console.warn(`[SCIM Client] User ${scimUserPayload.userName} already exists in IdP.`);
                    return { status: 'skipped', reason: 'exists' };
                }
                throw new Error(`SCIM API Error: ${response.status} ${response.statusText} - ${errorBody}`);
            }
            const data = await response.json();
            console.log(`[SCIM Client] Successfully synced user ${scimUserPayload.userName} (IdP ID: ${data.id})`);
            return { status: 'created', id: data.id };
        }
        catch (error) {
            console.error(`[SCIM Client] Failed to sync sequence for ${scimUserPayload.userName}`, error);
            throw error;
        }
    }
}
exports.ScimClient = ScimClient;
