export const rentalContractKeys = {
  all: ['rental-contracts'] as const,
  list: () => [...rentalContractKeys.all, 'list'] as const,
  listByParams: (params: unknown) => [...rentalContractKeys.list(), params] as const,
  detail: () => [...rentalContractKeys.all, 'detail'] as const,
  detailById: (id: string) => [...rentalContractKeys.detail(), id] as const,
};
