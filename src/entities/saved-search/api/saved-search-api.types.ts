export type SearchType = 'BUY' | 'RENT' | 'SELL';

export interface SearchCriteria {
  location?: string | string[];
  price?: [number | null, number | null];
  area?: [number | null, number | null];
  propertyType?: string | number;
  propertyCategory?: string | number;
  bedrooms?: number;
  bathrooms?: number;
  hasVideo?: boolean;
  has3D?: boolean;
  sortBy?: string;
  dynamicAttributes?: Record<string, boolean | string>;
  [key: string]: unknown;
}

export interface SavedSearchDto {
  saved_search_id: string;
  search_type: SearchType;
  criteria: SearchCriteria;
  board_id?: string;
  created_at: string;
  is_recommendation: boolean;
}

export interface SaveSearchRequest {
  search_type: SearchType;
  criteria: SearchCriteria;
  board_id?: string;
  profile_id?: string;
  is_recommendation?: boolean;
}
