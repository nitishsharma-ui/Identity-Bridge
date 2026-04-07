import { AgentResponse, User } from '@identity-bridge/shared-types';

export const fetchGroupsForUser = async (email: string): Promise<AgentResponse<User>> => {
  const agentUrl = process.env.AGENT_SERVICE_URL || 'http://localhost:4000';
  const apiKey = process.env.INTERNAL_API_KEY || 'super_secret_internal_api_key_123';

  try {
    const res = await fetch(`${agentUrl}/api/get-user-groups?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      // Important to use no-store if we want fresh proxying, but we can rely on agent server's cache
      cache: 'no-store'
    });

    const data: AgentResponse<User> = await res.json();
    return data;
  } catch (err: any) {
    console.error("Agent Service Error:", err);
    return {
      success: false,
      error: err.message || "Failed to reach Agent Service"
    }
  }
}
