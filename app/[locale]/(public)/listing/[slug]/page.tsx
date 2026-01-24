import { ListingDetailScreen } from '@/screens/listing-detail';
import type { Property } from '@/entities/property';

// Mock data - replace with actual API call
const mockProperty: Property = {
  id: '1',
  title: 'Beverly Springfield',
  address: '2821 Lake Sevilla, Palm Harbor, TX',
  price: 450000,
  bedrooms: 4,
  bathrooms: 3,
  area: 2500,
  description:
    'Beautiful property located in a prime location with modern amenities and stunning views.',
  images: [
    {
      id: '1',
      url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop',
      alt: 'Property exterior view',
      type: 'photo',
      isPrimary: true,
    },
    {
      id: '2',
      url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
      alt: 'Living room',
      type: 'photo',
      isPrimary: false,
    },
    {
      id: '3',
      url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop',
      alt: 'Kitchen',
      type: 'photo',
      isPrimary: false,
    },
    {
      id: '4',
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
      alt: 'Bedroom',
      type: 'photo',
      isPrimary: false,
    },
    {
      id: '5',
      url: 'https://my-3dtour.com/tour/123',
      alt: '3D Tour',
      type: '3d-tour',
      isPrimary: false,
    },
    {
      id: '6',
      url: 'https://my-videos.com/video/456.mp4',
      alt: 'Property Video',
      type: 'video',
      isPrimary: false,
    },
  ],
  amenities: ['Pool', 'Garage', 'Garden', 'Air Conditioning'],
  location: {
    lat: 28.0115,
    lng: -82.7534,
  },
  agent: {
    id: '1',
    name: 'John Doe',
    avatar: 'https://i.pravatar.cc/150?img=68',
    phone: '+1 234 567 890',
    email: 'john.doe@example.com',
  },
  createdAt: '2024-01-01',
  updatedAt: '2024-01-15',
};

interface ListingPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { slug } = await params;

  // TODO: Fetch property data by slug
  // const property = await fetchProperty(slug);

  return <ListingDetailScreen property={mockProperty} />;
}
