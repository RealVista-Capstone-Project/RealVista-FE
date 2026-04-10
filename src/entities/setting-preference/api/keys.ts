export const settingPreferenceKeys = {
  all: ['setting-preference'] as const,
  me: () => [...settingPreferenceKeys.all, 'me'] as const,
} as const
