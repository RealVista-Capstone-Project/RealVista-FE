/**
 * NextAuth module augmentation for custom User and Session types
 *
 * This extends the default NextAuth types to include our custom fields
 * like accessToken and role. These types are used throughout the app
 * to provide type safety for auth-related operations.
 */

import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  /**
   * Extended User interface with custom fields
   */
  interface User {
    id: string;
    email: string;
    accessToken?: string;
    role?: 'user' | 'owner' | 'admin' | 'moderator' | 'AGENT';
    avatar?: string;
    backendRoles?: string[];
  }

  /**
   * Extended Session interface with custom fields
   */
  interface Session {
    user: {
      id: string;
      email: string;
      role?: 'user' | 'owner' | 'admin' | 'moderator' | 'AGENT';
      avatar?: string;
      accessToken?: string;
      backendRoles?: string[];
    } & DefaultSession['user'];
  }
}

// Note: JWT augmentation is handled by NextAuth v5 automatically
// The JWT type will include our custom fields through the User interface
