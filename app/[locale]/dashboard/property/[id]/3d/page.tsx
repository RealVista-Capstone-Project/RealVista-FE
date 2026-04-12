'use client';

import React, { use } from 'react';
import { ThreeDManagementScreen } from '@/screens/dashboard/property-3d-management';

interface Property3DPageProps {
  params: Promise<{ id: string; locale: string }>;
  searchParams: Promise<{ roomName?: string }>;
}

export default function Property3DPage({ params, searchParams }: Property3DPageProps) {
  const resolvedParams = use(params);
  const resolvedSearch = use(searchParams);
  return (
    <ThreeDManagementScreen
      propertyId={resolvedParams.id}
      locale={resolvedParams.locale}
      initialRoomName={resolvedSearch.roomName}
    />
  );
}
