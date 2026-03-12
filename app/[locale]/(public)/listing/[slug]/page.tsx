import { ListingDetailScreen } from '@/screens/listing-detail';
import { listingApi, extractListingId } from '@/entities/listing';
import { notFound } from 'next/navigation';

interface ListingPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

/**
 * Listing Detail Page
 * Server Component that fetches listing data by slug (listingId)
 *
 * Slug format: {listing-name}-i.{listing-id}
 * Example: luxury-2-bedroom-apartment-nguyen-hue-i.610e8400-e29b-41d4-a716-446655440001
 */
export default async function ListingPage({ params }: ListingPageProps) {
  const { slug } = await params;

  try {
    // Extract listing_id from slug using the utility function
    const listingId = extractListingId(slug);

    console.log('[ListingPage] Slug:', slug);
    console.log('[ListingPage] Extracted ID:', listingId);

    // Fetch listing from API
    // The API returns { success, message, data, timestamp }
    const { payload: response } = await listingApi.getById(listingId);

    console.log('[ListingPage] API Response:', { success: response.success, hasData: !!response.data });

    // Extract the actual listing data from the response
    const listing = response.data;

    if (!listing) {
      console.error('[ListingPage] No listing data in response');
      notFound();
    }

    return <ListingDetailScreen listing={listing} />;
  } catch (error) {
    // If listing not found, return 404
    console.error('[ListingPage] Error fetching listing:', error);
    notFound();
  }
}
