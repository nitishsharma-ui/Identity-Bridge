import NextAuth from "next-auth"

const handler = NextAuth({
  providers: [
    {
      id: "custom-oidc",
      name: "SSO Provider",
      type: "oauth",
      // This will automatically fetch the endpoint URLs required for OIDC (authorization, token, userinfo)
      wellKnown: `${process.env.OIDC_ISSUER}/.well-known/openid-configuration`,
      authorization: { params: { scope: "openid email profile" } },
      idToken: true,
      checks: ["pkce", "state"],
      clientId: process.env.OIDC_CLIENT_ID || "",
      clientSecret: process.env.OIDC_CLIENT_SECRET || "",
      // Profile callback lets you map the Identity Provider's token claims to the NextAuth 'User' object
      profile(profileData) {
        const profile = profileData as any;
        return {
          id: profile.sub,
          name: profile.name || profile.preferred_username || profile.nickname,
          // Fallbacks for mapping the email claim (some 3rd party IdPs use 'upn' or 'unique_name')
          email: profile.email || profile.upn || profile.unique_name,
        }
      },
    }
  ],
  callbacks: {
    async jwt({ token, profile, account }) {
      // Pass the mapped email from profile into the JWT token if it exists
      if (profile) {
        const p = profile as any;
        token.email = p.email || p.upn || p.unique_name || token.email;
        token.name = p.name || p.preferred_username || p.nickname || token.name;
      }
      
      // DEBUG: This will print the raw profile and token in your terminal
      console.log("--- NEXTAUTH DEBUG ---");
      console.log("Account received (Tokens):", account);
      console.log("Profile received:", profile);
      console.log("JWT Token state:", token);
      
      return token;
    },
    async session({ session, token }) {
      // Expose the mapped email to the client-side session securely
      if (!session.user) {
        session.user = { email: "", name: "", image: "" };
      }
      session.user.email = (token.email as string) || session.user.email;
      session.user.name = (token.name as string) || session.user.name;
      
      return session;
    }
  }
})

export { handler as GET, handler as POST }
