export type SearchType = 'BUY' | 'RENT' | 'SELL';

export interface SavedSearchDto {
  saved_search_id: string;
  search_type: SearchType;
  criteria: Record<string, any>;
  created_at: string;
}

export interface SaveSearchRequest {
  search_type: SearchType;
  criteria: Record<string, any>;
}
