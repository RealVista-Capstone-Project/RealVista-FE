import { queryOptions } from '@tanstack/react-query';
import { bookmarkApi } from './bookmark.api';
import { bookmarkKeys } from './keys';
import type { GetBookmarksParams } from './bookmark-api.types';

export const bookmarkQueries = {
  list: (params: GetBookmarksParams = {}) =>
    queryOptions({
      queryKey: bookmarkKeys.list(params),
      queryFn: () => bookmarkApi.getBookmarks(params),
      staleTime: 2 * 60 * 1000,
    }),
} as const;
