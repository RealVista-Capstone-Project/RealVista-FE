import type { GetBookmarksParams } from './bookmark-api.types';

export const bookmarkKeys = {
  all: ['bookmarks'] as const,
  lists: () => [...bookmarkKeys.all, 'list'] as const,
  list: (params: GetBookmarksParams) => [...bookmarkKeys.lists(), params] as const,
} as const;
