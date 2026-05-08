'use client';

import * as React from 'react';

export type DashboardTopNavBadgeContextValue = {
  setPageCountBadge: (count: number | null) => void;
};

export const DashboardTopNavBadgeContext =
  React.createContext<DashboardTopNavBadgeContextValue | null>(null);

/**
 * Pushes a numeric badge next to the dashboard top-nav title while mounted.
 * Pass `null` to hide (e.g. while loading or on error).
 */
export function useSyncDashboardTopNavCountBadge(count: number | null) {
  const ctx = React.useContext(DashboardTopNavBadgeContext);
  React.useEffect(() => {
    if (!ctx) return;
    ctx.setPageCountBadge(count);
    return () => ctx.setPageCountBadge(null);
  }, [count, ctx]);
}
