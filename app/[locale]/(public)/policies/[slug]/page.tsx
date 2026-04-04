import { notFound } from 'next/navigation';
import { PolicyAPI } from '@/features/policy/api/policy.api';
import { PolicyContent } from '@/features/policy/ui/policy-content';
import { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const resolvedParams = await params;
  const policy = await PolicyAPI.getPolicyBySlug(resolvedParams.slug);

  if (!policy) {
    return {
      title: 'Policy Not Found | RealVista',
    };
  }

  return {
    title: `${policy.title} | Policies | RealVista`,
    description: `Read about ${policy.title} at RealVista.`,
  };
}

export default async function PolicyPage({ params }: Props) {
  const resolvedParams = await params;
  const policy = await PolicyAPI.getPolicyBySlug(resolvedParams.slug);

  if (!policy) {
    notFound();
  }

  return <PolicyContent policy={policy} />;
}
