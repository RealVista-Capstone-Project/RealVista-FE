'use client';

import { useQuery } from '@tanstack/react-query';
import { userQueries } from '@/entities/user/api';
import { useSession } from 'next-auth/react';
import { TopNav } from './top-nav';
import type { TopNavProps } from './top-nav';

// Raw snake_case shape from the /me API response
interface RawMe {
  first_name?: string | null
  last_name?: string | null
  full_name?: string | null
  business_name?: string | null
  avatar_url?: string | null
  email_verified_at?: string | null
  phone_verified_at?: string | null
  [key: string]: unknown
}

/**
 * TopNavContainer - Smart wrapper for TopNav that fetches current user data.
 * Uses the same `me()` query + cache as the settings page.
 */
export function TopNavContainer(props: Omit<TopNavProps, 'user'>) {
  const { data: session } = useSession();
  const isAuthenticated = !!(session as any)?.user?.accessToken;

  const { data: meResponse } = useQuery({
    ...userQueries.me(),
    enabled: isAuthenticated,
  });

  const me = meResponse?.payload?.data as RawMe | undefined;

  const userData = me
    ? {
        name: buildName(me.first_name, me.last_name, me.business_name),
        initials: getInitials(me.first_name, me.business_name),
        avatar: me.avatar_url ?? undefined,
      }
    : undefined;

  return <TopNav {...props} user={userData} />;
}

function buildName(
  firstName?: string | null,
  lastName?: string | null,
  businessName?: string | null
): string {
  if (businessName) return businessName;
  const parts = [firstName, lastName].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  return 'User';
}

function getInitials(
  firstName?: string | null,
  businessName?: string | null
): string {
  const source = businessName || firstName || '';
  return source.charAt(0).toUpperCase() || 'U';
}
