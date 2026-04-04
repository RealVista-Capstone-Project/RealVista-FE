import { queryOptions } from '@tanstack/react-query';
import { rentalContractApi } from './rental-contract.api';
import { rentalContractKeys } from './keys';
import type { GetRentalContractsParams } from '../model/types';

export const rentalContractQueries = {
  list: (params: GetRentalContractsParams) =>
    queryOptions({
      queryKey: rentalContractKeys.listByParams(params),
      queryFn: () => rentalContractApi.getRentalContracts(params),
      staleTime: 2 * 60 * 1000,
    }),
};
