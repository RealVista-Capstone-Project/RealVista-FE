import { Metadata } from 'next';
import { ManagedListingsPage } from '@/screens/dashboard/managed-listings';

export const metadata: Metadata = {
  title: 'Manage Listings | RealVista Dashboard',
  description: 'Manage your property listings, view details, and track occupancy status.',
};

export default function QuanLyBaiDangPage() {
  return <ManagedListingsPage />;
}
