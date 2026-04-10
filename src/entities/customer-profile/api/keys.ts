export const customerProfileKeys = {
  all: ['customer-profiles'] as const,
  me: () => [...customerProfileKeys.all, 'me'] as const,
} as const
