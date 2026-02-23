import http from '@/shared/lib/http';
import type { ApiResponse } from '@/shared/types/api-response';
import type { BookmarkPageResponse, GetBookmarksParams } from './bookmark-api.types';

function buildBookmarksUrl(params: GetBookmarksParams): string {
  const searchParams = new URLSearchParams();

  if (params.propertyTypes && params.propertyTypes.length > 0) {
    params.propertyTypes.forEach((type) => searchParams.append('propertyTypes', type));
  }
  if (params.listingType) {
    searchParams.set('listingType', params.listingType);
  }
  if (params.sortDirection) {
    searchParams.set('sortDirection', params.sortDirection);
  }
  if (params.page !== undefined) {
    searchParams.set('page', String(params.page));
  }
  if (params.size !== undefined) {
    searchParams.set('size', String(params.size));
  }

  const queryString = searchParams.toString();
  return `/listings/bookmark${queryString ? `?${queryString}` : ''}`;
}

export const bookmarkApi = {
  getBookmarks: (params: GetBookmarksParams = {}) =>
    http.get<ApiResponse<BookmarkPageResponse>>(buildBookmarksUrl(params)),

  toggleBookmark: (listingId: string) =>
    http.post<ApiResponse<unknown>>(`/listings/bookmark/${listingId}`, {}),
} as const;
