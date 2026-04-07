import NextAuth, { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "custom-oidc",
      name: "SSO Provider",
      type: "oauth",
      wellKnown: `${process.env.OIDC_ISSUER}/.well-known/openid-configuration`,
      authorization: { 
        params: { 
          scope: "openid profile email user_info_all",
          groups_info: "0",
        } 
      },
      idToken: true,
      checks: ["pkce", "state"],
      clientId: process.env.OIDC_CLIENT_ID || "",
      clientSecret: process.env.OIDC_CLIENT_SECRET || "",
      userinfo: {
        url: `${process.env.OIDC_ISSUER}/users-srv/userinfo`,
        async request(context) {
          const res = await fetch(`${process.env.OIDC_ISSUER}/users-srv/userinfo`, {
            headers: {
              Authorization: `Bearer ${context.tokens.access_token}`,
            },
          });
          return await res.json();
        }
      },
      profile(profileData) {
        const profile = profileData as any;
        return {
          id: profile.sub,
          name: profile.name || profile.preferred_username || profile.nickname,
          email: profile.email || profile.upn || profile.unique_name,
        }
      },
    }
  ],
  callbacks: {
    async jwt({ token, profile }) {
      if (profile) {
        const p = profile as any;
        token.email = p.email || p.upn || p.unique_name || token.email;
        token.name = p.name || p.preferred_username || p.nickname || token.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (!session.user) {
        session.user = { email: "", name: "", image: "" } as any;
      }
      session.user.email = (token.email as string) || session.user.email || "";
      session.user.name = (token.name as string) || session.user.name || "";
      return session;
    }
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
