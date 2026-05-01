'use client';

import { OwnerDashboard } from '@/widgets/owner-dashboard';

/**
 * Owner Dashboard Page
 *
 * Real-estate owner dashboard inspired by shadcnuikit.com/dashboard/real-estate
 * Features:
 * - KPI stats cards (Active Leads, Revenue, Active Listings, Closed Deals)
 * - Deal pipeline banner
 * - Performance area chart with Revenue/Visit toggle & W/M/Y periods
 * - Sales analytics donut chart
 * - Leads contact list
 * - Reminder card with date badges
 * - Schedule calendar with tab filters
 * - Property overview with progress indicators
 * - Active listings table with search & status filter
 */
export function DashboardPage() {
  return <OwnerDashboard />;
}
