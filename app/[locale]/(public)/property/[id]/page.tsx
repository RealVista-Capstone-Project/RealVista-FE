import { PropertyDetailScreen } from '@/screens/property-detail/ui/property-detail-screen';
import { Metadata } from 'next';

interface PropertyPageProps {
  params: {
    id: string;
    locale: string;
  };
}

export async function generateMetadata({ params }: PropertyPageProps): Promise<Metadata> {
  return {
    title: `Property Detail | RealVista`,
    description: `View details for property ${params.id}`,
  };
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { id } = await params;
  return <PropertyDetailScreen propertyId={id} />;
}
