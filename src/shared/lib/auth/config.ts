import { env } from '@/shared/lib/env';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import http from '@/shared/lib/http/http';
import { determineUserRole } from './rbac';

/**
 * OAuth credentials schema for Zod validation
 */
const oauthSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  email: z.string().email('Invalid email format'),
  accessToken: z.string().min(1, 'Access token is required'),
  roles: z.string().optional(), // Comma-separated roles from backend
});

/**
 * Backend API response types
 */
type BackendLoginResponse = {
  success: boolean;
  message: string;
  data: {
    type: string;
    user_id: number;
    email: string;
    access_token: string;
    roles?: string[]; // Roles from backend
  };
  timestamp: string;
};

/**
 * NextAuth configuration with Credentials provider
 * Integrates with backend API at ${env.NEXT_PUBLIC_API_ENDPOINT}/auth/login
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Validate credentials presence
        if (!credentials?.email || !credentials?.password) {
          console.error('[NextAuth] Email and password required');
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          console.log('[NextAuth] Attempting login');

          // Call backend API using centralized http client
          const result = await http.post<BackendLoginResponse>(
            '/auth/login',
            { email, password },
            { baseUrl: env.NEXT_PUBLIC_API_ENDPOINT }
          );

          if (!result.payload?.data) {
            console.error('[NextAuth] Login failed: Invalid response structure');
            return null;
          }

          // Extract from nested response structure
          const { user_id, email: userEmail, access_token, roles } = result.payload.data;

          console.log('[NextAuth] Login successful');

          // Determine primary role from all backend roles
          // If user has ANY of [BUYER, TENANT, OWNER] → public layout ('user')
          // If user ONLY has ADMIN or AGENT → dashboard layout ('admin' or 'moderator')
          const mappedRole = determineUserRole(roles);

          // Return user object with accessToken, role, and backend roles
          return {
            id: user_id.toString(),
            email: userEmail,
            accessToken: access_token,
            role: mappedRole,
            backendRoles: roles, // Store original backend roles for granular access control
          };
        } catch (error) {
          console.error('[NextAuth] Login error:', error);
          return null;
        }
      },
    }),
    Credentials({
      id: 'oauth',
      name: 'OAuth',
      credentials: {
        userId: { label: 'User ID', type: 'text' },
        email: { label: 'Email', type: 'email' },
        accessToken: { label: 'Access Token', type: 'password' },
        roles: { label: 'Roles', type: 'text' },
      },
      async authorize(credentials) {
        try {
          // Validate credentials using Zod schema
          const validatedCredentials = oauthSchema.parse(credentials);

          console.log('[NextAuth] OAuth login successful');

          // Parse roles from comma-separated string, or default to 'user'
          const backendRoles = validatedCredentials.roles
            ? validatedCredentials.roles.split(',').map((r) => r.trim())
            : undefined;
          const mappedRole = determineUserRole(backendRoles);

          // Return user object with proper type (no 'as any' needed)
          return {
            id: validatedCredentials.userId,
            email: validatedCredentials.email,
            accessToken: validatedCredentials.accessToken,
            role: mappedRole,
          };
        } catch (error) {
          console.error('[NextAuth] OAuth validation error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    // Middleware will handle locale prefix dynamically
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    /**
     * JWT callback - adds custom fields to token
     */
    async jwt({ token, user, trigger, session }) {
      if (trigger === 'update' && session) {
        return { ...token, ...session };
      }
      if (user) {
        // First login, add user data to token (type-safe)
        token.id = user.id;
        token.role = user.role;
        // Store accessToken for use in HTTP client
        token.accessToken = user.accessToken;
        // Store backend roles for granular access control
        token.backendRoles = (user as any).backendRoles;
      }
      return token;
    },
    /**
     * Session callback - adds custom fields to session
     */
    async session({ session, token }) {
      if (session.user && token) {
        // Type assertions needed because token properties are unknown
        session.user.id = token.id as string;
        session.user.role = token.role as 'user' | 'owner' | 'admin' | 'moderator' | undefined;
        session.user.accessToken = token.accessToken as string | undefined;
        (session.user as any).backendRoles = token.backendRoles as string[] | undefined;
      }
      return session;
    },
  },
});
