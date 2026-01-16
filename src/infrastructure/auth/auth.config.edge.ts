import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-compatible auth config for middleware
 * Does not include providers that require Node.js runtime (like Prisma)
 */
export const authConfigEdge: NextAuthConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [], // Providers are added in the full config
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.tenantSlug = user.tenantSlug;
        token.tenantTier = user.tenantTier;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.tenantId = token.tenantId as string;
        session.user.tenantSlug = token.tenantSlug as string;
        session.user.tenantTier = token.tenantTier as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
};
