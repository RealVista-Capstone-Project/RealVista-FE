import 'next-auth';
import 'next-auth/jwt';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'user' | 'admin' | 'moderator';
      avatar?: string;
    } & DefaultSession['user'];
  }

  interface User {
    role?: 'user' | 'admin' | 'moderator';
    avatar?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'user' | 'admin' | 'moderator';
    accessToken?: string;
  }
}
