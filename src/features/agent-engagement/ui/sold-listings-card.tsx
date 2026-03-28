'use client';

import type { AgentEngagement } from '@/entities/agent-engagement';
import { RealVistaListingCard } from '@/shared/ui/realvista-listing-card/realvista-listing-card';

const FALLBACK_IMAGE = 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';

interface SoldListingsCardProps {
  agent: AgentEngagement;
}

/**
 * Displays the single listing sold by the agent for this engagement.
 * Returns null (invisible) when no sold listing exists.
 * Per business rule, at most one listing per engagement can reach SOLD status.
 */
export function SoldListingsCard({ agent }: SoldListingsCardProps) {
  const listing = agent.sold_listing;
  if (!listing) return null;

  return (
    <RealVistaListingCard
      id={listing.listing_id}
      image={listing.image_url ?? FALLBACK_IMAGE}
      title={listing.title}
      address={listing.address ?? agent.property_address ?? ''}
      price={listing.price}
      attributes={listing.attributes}
      listingType={listing.listing_type ?? 'SALE'}
      statusTag='SOLD'
      variant='list'
    />
  );
}
