import { PropertyDetailScreen } from '@/screens/property-detail/ui/property-detail-screen';
import { Metadata } from 'next';

interface PropertyPageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export async function generateMetadata({ params }: PropertyPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Property Detail | RealVista`,
    description: `View details for property ${id}`,
  };
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { id } = await params;
  return <PropertyDetailScreen propertyId={id} />;
}
