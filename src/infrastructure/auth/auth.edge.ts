import NextAuth from 'next-auth';
import { authConfigEdge } from './auth.config.edge';

/**
 * Edge-compatible auth instance for middleware
 * Does not use Prisma or any Node.js-only APIs
 */
export const { auth } = NextAuth(authConfigEdge);
