import type { RealVistaListingCardProps } from '@/shared/ui/realvista-listing-card/realvista-listing-card';

/**
 * Mock data for similar property listings
 * In production, this would come from an API call
 */
export const mockSimilarProperties: Omit<
  RealVistaListingCardProps,
  'onToggleFavorite' | 'onClick'
>[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop',
    title: 'Faulkner Ave',
    address: '909 Woodland St, Michigan, IN',
    price: 4550,
    currency: '$',
    beds: 4,
    bathrooms: 3,
    area: 810,
    areaUnit: 'm²',
    isFavorite: false,
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop',
    title: 'St. Crystal',
    address: '210 US Highway, Highland Lake, FL',
    price: 2400,
    currency: '$',
    beds: 4,
    bathrooms: 2,
    area: 68,
    areaUnit: 'm²',
    isFavorite: false,
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop',
    title: 'Tarpon Bay',
    address: '103 Lake Shores, Michigan, IN',
    price: 1600,
    currency: '$',
    beds: 3,
    bathrooms: 1,
    area: 57,
    areaUnit: 'm²',
    isFavorite: false,
  },
];
