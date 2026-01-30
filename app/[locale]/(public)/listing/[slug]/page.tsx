import { ListingDetailScreen } from '@/screens/listing-detail';
import { listingApi } from '@/entities/listing';
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
 */
export default async function ListingPage({ params }: ListingPageProps) {
  const { slug } = await params;

  try {
    // Fetch listing from API
    // The API returns { success, message, data, timestamp }
    const { payload: response } = await listingApi.getById(slug);

    // Extract the actual listing data from the response
    const listing = response.data;

    return <ListingDetailScreen listing={listing} />;
  } catch (error) {
    // If listing not found, return 404
    notFound();
  }
}
