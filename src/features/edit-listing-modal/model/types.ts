import { ListingType } from '@/entities/listing';

export interface EditListingFormData {
  name: string;
  price: string;
  minPrice: string;
  maxPrice: string;
  isNegotiable: boolean;
  availableFrom: string;
  content: string;
  selectedMediaIds: string[];
  primaryMediaId?: string;
  listingType: ListingType;
}

export interface EditListingPayload {
  name?: string;
  price?: number;
  min_price?: number | null;
  max_price?: number | null;
  is_negotiable?: boolean;
  available_from?: string | null;
  content?: string | null;
  media_ids?: string[];
  primary_media_id?: string | null;
  listing_type?: ListingType;
}
