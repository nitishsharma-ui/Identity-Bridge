import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { getCache } from '../cache';
import { fetchUserAttrs } from '../ldap/connector';
import { AgentResponse, User } from '@identity-bridge/shared-types';

export const apiRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // API Key Authentication Middleware
  app.addHook('preHandler', async (request, reply) => {
    const internalApiKey = process.env.API_KEY;
    const authHeader = request.headers['authorization'];
    
    // Simple Bearer token check for internal API security
    if (!authHeader || authHeader !== `Bearer ${internalApiKey}`) {
      app.log.warn('Unauthorized API access attempt');
      return reply.code(401).send({ success: false, error: 'Unauthorized. Invalid or missing API key.' });
    }
  });

  app.get('/get-user-groups', async (request, reply) => {
    const { email } = request.query as { email?: string };

    if (!email) {
      return reply.code(400).send({ success: false, error: 'Email parameter is required.' });
    }

    try {
      const cache = getCache();
      const cacheKey = `user:${email}`;

      // 1. Check Cache
      const cached = await cache.get(cacheKey);
      if (cached) {
        request.log.info({ email }, 'Cache hit for user groups');
        return reply.send({ success: true, data: cached });
      }

      // 2. Fallback to LDAP
      request.log.info({ email }, 'Cache miss for user groups. Querying LDAP.');
      const userAttrs = await fetchUserAttrs(email);

      if (!userAttrs) {
        return reply.code(404).send({ success: false, error: 'User not found in Active Directory.' });
      }

      const userData: User = userAttrs;

      // Cache for 1 hour
      await cache.set(cacheKey, userData, 3600);

      const response: AgentResponse<User> = { success: true, data: userData };
      return reply.send(response);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ success: false, error: 'Internal server error while fetching user groups.' });
    }
  });
};
