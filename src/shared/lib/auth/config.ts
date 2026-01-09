import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

/**
 * OAuth credentials schema for Zod validation
 */
const oauthSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  email: z.string().email('Invalid email format'),
  accessToken: z.string().min(1, 'Access token is required'),
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
  };
  timestamp: string;
};

/**
 * NextAuth configuration with Credentials provider
 * Integrates with backend API at http://localhost:8080/api/v1/auth/login
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

        // Backend API endpoint (use absolute URL on server)
        const apiUrl = 'http://localhost:8080/api/v1/auth/login';

        try {
          console.log('[NextAuth] Attempting login for:', email);

          // Call backend API
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          const data: BackendLoginResponse = await response.json();

          if (!response.ok) {
            console.error('[NextAuth] Login failed:', response.status, data);
            return null;
          }

          // Extract from nested response structure
          const { user_id, email: userEmail, access_token } = data.data;

          console.log('[NextAuth] Login successful for:', userEmail);

          // Return flat user object with accessToken
          // Note: id must be a string for NextAuth
          // Type assertion needed because we extended the User interface
          return {
            id: user_id.toString(),
            email: userEmail,
            accessToken: access_token,
          } as any;
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
      },
      async authorize(credentials) {
        try {
          // Validate credentials using Zod schema
          const validatedCredentials = oauthSchema.parse(credentials);

          console.log('[NextAuth] OAuth login successful for:', validatedCredentials.email);

          // Return user object with same structure as existing provider
          return {
            id: validatedCredentials.userId,
            email: validatedCredentials.email,
            accessToken: validatedCredentials.accessToken,
            role: 'user',
          } as any;
        } catch (error) {
          console.error('[NextAuth] OAuth validation error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/vi/login', // Default locale, will be dynamic with middleware later
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    /**
     * JWT callback - adds custom fields to token
     */
    async jwt({ token, user }) {
      if (user) {
        // First login, add user data to token
        // Type assertions needed because user comes from our extended interface
        token.id = user.id as string;
        token.role = user.role as 'user' | 'admin' | 'moderator';
        // Store accessToken for use in HTTP client
        (token as any).accessToken = (user as any).accessToken;
      }
      return token;
    },
    /**
     * Session callback - adds custom fields to session
     */
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'user' | 'admin' | 'moderator';
      }
      return session;
    },
  },
});
