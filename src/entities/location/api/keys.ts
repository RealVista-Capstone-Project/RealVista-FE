import type { AdminLocationListParams } from './location-api.types';

export const locationKeys = {
  all: ['locations'] as const,

  cities: () => [...locationKeys.all, 'cities'] as const,
  districts: () => [...locationKeys.all, 'districts'] as const,
  children: (parentId: string) => [...locationKeys.all, 'children', parentId] as const,

  // Admin
  admin: () => [...locationKeys.all, 'admin'] as const,
  adminList: (params?: AdminLocationListParams) =>
    [...locationKeys.admin(), 'list', params] as const,
} as const;
