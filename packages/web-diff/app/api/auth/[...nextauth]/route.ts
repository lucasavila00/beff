import NextAuth, { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
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
    // async jwt({ token, account, user }) {
    //   // Persist the OAuth access_token to the token right after signin
    //   console.log({ user, account, token });
    //   token.user_id = user?.id;
    //   return token;
    // },
    async session({ session, token }) {
      // Send properties to the client, like an access_token from a provider.
      (session as any).user_id = token.sub;
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
