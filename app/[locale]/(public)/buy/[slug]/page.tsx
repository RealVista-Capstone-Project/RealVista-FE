import { ListingDetailScreen } from '@/screens/listing-detail';
import { listingApi, extractListingId } from '@/entities/listing';
import { auth } from '@/shared/lib/auth/config';
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
 *
 * Access control:
 * - PUBLISHED listings → accessible by anyone
 * - Non-PUBLISHED listings → only the listing creator or property owner can preview; others get 404
 */
export default async function ListingPage({ params }: ListingPageProps) {
  const { slug } = await params;

  try {
    // Extract listing_id from slug using the utility function
    const listingId = extractListingId(slug);

    const session = await auth();
    const { payload: response } = await listingApi.getById(listingId, true, false, {
      headers: session?.user.accessToken
        ? { Authorization: `Bearer ${session.user.accessToken}` }
        : undefined,
    });

    // Extract the actual listing data from the response
    const listing = response.data;

    const isPublished = listing.status === 'PUBLISHED';
    const isCreator = !!session && session.user.id === listing.user_id;
    const isAdmin = !!session && session.user.role === 'admin';
    const isPropertyOwner = !!session && session.user.id === listing.property_owner?.user_id;

    // Non-published listings: only the creator, property owner or an admin can view — everyone else gets 404
    // Returning notFound() (not 403) to avoid leaking that the listing exists
    if (!isPublished && !isCreator && !isAdmin && !isPropertyOwner) {
      notFound();
    }

    return <ListingDetailScreen listing={listing} isPreview={!isPublished} />;
  } catch {
    // If listing not found, return 404
    notFound();
  }
}
