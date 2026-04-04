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
  [key: string]: any;
}

export interface SavedSearchDto {
  saved_search_id: string;
  search_type: SearchType;
  criteria: SearchCriteria;
  created_at: string;
}

export interface SaveSearchRequest {
  search_type: SearchType;
  criteria: SearchCriteria;
}
