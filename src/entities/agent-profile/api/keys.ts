export const agentProfileKeys = {
  all: ['agent-profile'] as const,
  me: () => [...agentProfileKeys.all, 'me'] as const,
} as const;
