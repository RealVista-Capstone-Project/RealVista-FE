export const agentProfileKeys = {
  all: ['agent-profile'] as const,
  me: () => [...agentProfileKeys.all, 'me'] as const,
  list: (params?: { propertyId?: string; search?: string; minRating?: number }) =>
    [...agentProfileKeys.all, 'list', params] as const,
  reviews: (agentId: string) => [...agentProfileKeys.all, 'reviews', agentId] as const,
} as const;
