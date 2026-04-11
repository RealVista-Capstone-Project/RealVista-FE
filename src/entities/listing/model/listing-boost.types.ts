export interface ListingBoostResponse {
  listing_boost_id: string;
  listing_id: string;
  boost_type: 'FEATURED' | 'HOT_BADGE';
  start_date: string;
  end_date: string;
  status: string;
}

export interface ApplyBoostRequest {
  boost_type: 'FEATURED' | 'HOT_BADGE';
}
