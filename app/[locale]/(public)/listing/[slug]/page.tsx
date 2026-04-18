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
    const listingId = extractListingId(slug);

    // Fetch listing from API
    // The API returns { success, message, data, timestamp }
    const { payload: response } = await listingApi.getById(listingId, true);

    // Extract the actual listing data from the response
    const listing = response.data;

    if (!listing) {
      notFound();
    }

    return <ListingDetailScreen listing={listing} />;
  } catch {
    // If listing not found, return 404
    notFound();
  }
}
