'use client';

import React, { use } from 'react';
import { ThreeDManagementScreen } from '@/screens/dashboard/property-3d-management';

interface Property3DPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default function Property3DPage({ params }: Property3DPageProps) {
  const resolvedParams = use(params);
  return (
    <ThreeDManagementScreen
      propertyId={resolvedParams.id}
      locale={resolvedParams.locale}
    />
  );
}
