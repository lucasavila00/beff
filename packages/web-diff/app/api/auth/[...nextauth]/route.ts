import NextAuth, { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,

      authorization: {
        // always prompt
        url: "https://github.com/login/oauth/authorize?prompt=consent",
        params: { scope: "" },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        // console.log({ account });
        token.providerData = {
          provider: account.provider,
          accessToken: account.access_token,
          providerAccountId: account.providerAccountId,
          token_type: account.token_type,
          scope: account.scope,
        };
      }
      return token;
    },
    async session({ session, token, user }) {
      // Send properties to the client, like an access_token from a provider.
      (session as any).accessToken = (token as any).providerData.accessToken;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
