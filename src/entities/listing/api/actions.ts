'use server';

import { revalidateTag } from 'next/cache';

/**
 * Server Action to revalidate a single listing detail page.
 * This should be called from client-side mutations when a listing is updated.
 */
export async function revalidateListing(listingId: string) {
  try {
    revalidateTag('listing-detail');
    revalidateTag(listingId);
    console.log(`[revalidateListing] Evicted cache for listing: ${listingId}`);
  } catch (error) {
    console.error(`[revalidateListing] Failed to revalidate listing ${listingId}:`, error);
  }
}
