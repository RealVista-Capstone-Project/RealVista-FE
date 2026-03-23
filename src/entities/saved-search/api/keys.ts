export const savedSearchKeys = {
  all: ['saved-searches'] as const,
  lists: () => [...savedSearchKeys.all, 'list'] as const,
} as const;
