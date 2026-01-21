'use client';

import { PublicLayout } from '@/widgets/layout';

export default function PublicRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicLayout>{children}</PublicLayout>;
}
