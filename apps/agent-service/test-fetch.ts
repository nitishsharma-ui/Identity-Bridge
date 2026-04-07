import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import crypto from 'crypto';

async function run() {
  const payload = {
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
    externalId: "skillmine",
    userName: "skillmine@smtc.test.com",
    name: {
      formatted: "Skillmine",
      familyName: "Unknown",
      givenName: "Skillmine"
    },
    displayName: "Skillmine",
    password: crypto.randomBytes(8).toString('hex') + 'A1!'
  };

  console.log('Sending payload for skillmine:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(`${process.env.SCIM_BASE_URL}/Users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SCIM_BEARER_TOKEN}`,
        'User-Agent': 'curl/7.68.0' 
      },
      body: JSON.stringify(payload)
    });
    
    console.log(`STATUS: ${response.status} ${response.statusText}`);
    const text = await response.text();
    console.log(`BODY:`, text.substring(0, 500));
  } catch (err: any) {
    console.error('ERROR:', err.message);
  }
}

run();
