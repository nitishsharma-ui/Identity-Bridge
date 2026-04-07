import crypto from 'crypto';

export const mapLdapUserToScim = (adUser: any) => {
  // Active Directory DOES NOT allow fetching plain-text passwords via LDAP for security reasons.
  // Since the auth-mine IdP crashes if a password is not provided, we must send a randomized
  // mock password. If users authenticate via OIDC/SSO later, this password will be irrelevant.
  const mockPassword = crypto.randomBytes(8).toString('hex') + 'A1!';

  return {
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
    externalId: adUser.username,
    userName: adUser.email || adUser.username, // Sometimes IdPs expect emails in userName
    name: {
      formatted: adUser.name || adUser.username,
      familyName: adUser.name.split(' ').pop() || adUser.username,
      givenName: adUser.name.split(' ')[0] || adUser.username
    },
    displayName: adUser.name || adUser.username,
    password: mockPassword
  };
};

export const mapLdapGroupToScim = (groupName: string, scimMemberIds: string[] = []) => {
  return {
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:Group"],
    displayName: groupName,
    members: scimMemberIds.map(memberId => ({ value: memberId }))
  };
};
