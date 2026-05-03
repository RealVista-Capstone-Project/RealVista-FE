import { LucideIcon } from 'lucide-react';

export interface SidebarMenuItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number | string;
  badgeVariant?: 'danger' | 'warning' | 'info' | 'success';
}
