import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { fetchUsersDelta } from './src/modules/ldap/fetcher';
import { mapLdapUserToScim } from './src/modules/mapping/scim';

async function verifyPayloads() {
  const adUsers = await fetchUsersDelta(null);
  console.log(`Extracted ${adUsers.length} users.`);
  
  for (const user of adUsers) {
    if (user.username === 'test.user' || user.username === 'skillmine' || user.username === 'nikhil') {
      console.log(`\n--- SCIM Payload for ${user.username} ---`);
      console.log(JSON.stringify(mapLdapUserToScim(user), null, 2));
    }
  }
  process.exit(0);
}

verifyPayloads().catch(console.error);
