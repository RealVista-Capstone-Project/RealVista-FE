export interface PropertyAttributeDTO {
  attribute_id: string;
  attribute_code: string;
  attribute_name: string;
  data_type: string | null;
  icon: string | null;
  unit: string | null;
  value_number: number | null;
  value_text: string | null;
  value_boolean: boolean | null;
}

export type BookmarkListingType = 'SALE' | 'RENT';

import type { ListingSearchResponse } from '@/shared/types/search';

export interface BookmarkPageResponse {
  content: ListingSearchResponse[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
  first: boolean;
  last: boolean;
}

export interface GetBookmarksParams {
  propertyTypes?: string[];
  listingType?: 'SALE' | 'RENT';
  sortDirection?: 'NEWEST' | 'OLDEST';
  page?: number;
  size?: number;
}
