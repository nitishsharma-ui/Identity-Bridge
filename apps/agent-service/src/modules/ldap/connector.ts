import { Client } from 'ldapts';

export const getLdapClient = async (): Promise<Client> => {
  const url = process.env.LDAP_URL;
  if (!url) {
    throw new Error('LDAP_URL environment variable is missing.');
  }

  const client = new Client({
    url,
  });

  const bindDn = process.env.LDAP_BIND_DN;
  const bindPass = process.env.LDAP_BIND_PASS;

  if (bindDn && bindPass) {
    await client.bind(bindDn, bindPass);
    console.log('LDAP connection successfully established');
  } else {
    console.log('LDAP connection (anonymous) ready');
  }

  return client;
};

export const fetchUserAttrs = async (email: string) => {
  let client: Client | null = null;
  try {
    client = await getLdapClient();

    const baseDn = process.env.LDAP_BASE_DN || '';
    // Typically, map email -> userPrincipalName in Active Directory
    const filter = `(&(objectClass=user)(userPrincipalName=${email}))`;

    const { searchEntries } = await client.search(baseDn, {
      filter,
      scope: 'sub',
      attributes: ['sAMAccountName', 'userPrincipalName', 'displayName', 'memberOf'],
    });

    if (searchEntries.length === 0) {
      return null;
    }

    const userEntry = searchEntries[0];
    
    // Process single or multiple group entries effectively
    let groups: string[] = [];
    if (userEntry.memberOf) {
      if (Array.isArray(userEntry.memberOf)) {
        groups = (userEntry.memberOf as unknown as string[]).map(g => String(g));
      } else {
        groups = [String(userEntry.memberOf)];
      }
    }

    return {
      username: userEntry.sAMAccountName?.toString() || '',
      email: userEntry.userPrincipalName?.toString() || email,
      name: userEntry.displayName?.toString() || '',
      groups,
    };
  } finally {
    if (client) {
      await client.unbind();
    }
  }
};
