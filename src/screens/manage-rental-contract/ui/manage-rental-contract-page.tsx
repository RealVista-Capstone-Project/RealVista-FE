'use client';

import {
  ManageRentalContractProvider,
  useManageRentalContractContext,
} from '@/features/rental-contract/model/manage-rental-contract-context';
import { ContractListItem } from '@/features/rental-contract/ui/contract-list-item';
import { ContractDetailPanel } from '@/features/rental-contract/ui/contract-detail-panel';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { useRouter } from '@/shared/config/i18n/navigation';
import { ROUTES } from '@/shared/config/routes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select/select';
import { cn } from '@/shared/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  FileSearch,
  Plus,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

function ManageRentalContractContent() {
  const router = useRouter();
  const {
    contracts,
    currentPage,
    handleContractClick,
    isError,
    isLoading,
    itemsPerPage,
    searchQuery,
    selectedContract,
    setCurrentPage,
    setSearchQuery,
    setSelectedContract,
    setStatusFilter,
    statusFilter,
    totalElements,
    totalPages,
  } = useManageRentalContractContext();

  const t = useTranslations('ManageRentalContract');
  const tStatus = useTranslations('RentalContract.status');

  if (isLoading) {
    return (
      <div className='flex h-full items-center justify-center bg-[#F6F4FF]'>
        <div className='flex flex-col items-center gap-4'>
          <div className='h-10 w-10 animate-spin rounded-full border-[3px] border-primary border-t-transparent' />
          <p className='text-sm font-medium tracking-wide text-muted-foreground'>{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className='flex h-full items-center justify-center bg-[#F6F4FF]'>
        <div className='flex max-w-xs flex-col items-center gap-3 text-center'>
          <div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm'>
            <FileSearch className='h-8 w-8 text-primary' />
          </div>
          <p className='font-semibold text-foreground'>{t('error')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='h-full bg-[radial-gradient(circle_at_top_left,_rgba(122,92,255,0.10),_transparent_28%),linear-gradient(180deg,#F6F4FF_0%,#F9F8FE_32%,#F7F7FD_100%)]'>
      <div className='mx-auto px-6 py-6'>
        <div className='mb-6 rounded-3xl border border-white/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(246,243,255,0.92))] p-6 shadow-[0_20px_60px_rgba(96,72,179,0.08)] backdrop-blur-md'>
          <div className='flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between'>
            <div className='max-w-2xl'>
              <p className='text-xs font-semibold uppercase tracking-[0.24em] text-primary/70'>
                {t('hero.eyebrow')}
              </p>
              <h1 className='mt-3 text-3xl font-semibold tracking-[-0.03em] text-foreground'>
                {t('hero.title')}
              </h1>
              <p className='mt-3 max-w-xl text-sm leading-7 text-muted-foreground'>
                {t('hero.subtitle')}
              </p>
            </div>

            <div className='grid gap-3 xl:min-w-[420px]'>
              <div className='flex justify-end'>
                <Button
                  type='button'
                  className='h-11 rounded-xl bg-primary px-4 text-white shadow-[0_18px_30px_rgba(92,63,214,0.24)] hover:bg-primary-hover'
                  onClick={() => router.push(ROUTES.dashboard.createRentalContract)}
                >
                  <Plus className='h-4 w-4' />
                  {t('hero.createButton')}
                </Button>
              </div>

              <div className='grid gap-3 sm:grid-cols-2'>
                <div className='rounded-2xl border border-[#ECE9FB] bg-white/80 p-4'>
                  <p className='text-[11px] uppercase tracking-[0.16em] text-muted-foreground/70'>
                    {t('hero.stats.totalContracts')}
                  </p>
                  <p className='mt-2 text-2xl font-semibold text-foreground'>{totalElements}</p>
                </div>
                <div className='rounded-2xl border border-[#ECE9FB] bg-white/80 p-4'>
                  <p className='text-[11px] uppercase tracking-[0.16em] text-muted-foreground/70'>
                    {t('hero.stats.activeSelection')}
                  </p>
                  <p className='mt-2 text-sm font-semibold text-foreground'>
                    {selectedContract?.tenant.fullName ?? t('hero.noSelection')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='flex flex-col items-start gap-6 lg:flex-row'>
          <div
            className={cn(
              'flex min-w-0 flex-col transition-all duration-300',
              selectedContract ? 'w-full lg:basis-[60%] lg:max-w-[60%]' : 'flex-1 w-full'
            )}
          >
            <div className='mb-5 flex flex-col gap-3 rounded-3xl border border-white/60 bg-white/90 p-4 shadow-[0_12px_36px_rgba(94,74,175,0.08)] sm:flex-row sm:items-center'>
              <div className='flex w-full flex-shrink-0 items-center gap-2 sm:w-auto'>
                <SlidersHorizontal className='h-4 w-4 flex-shrink-0 text-muted-foreground/70' />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className='h-10 w-full rounded-xl border-transparent bg-[#F5F3FF] text-sm font-medium focus:ring-primary/20 sm:w-48'>
                    <SelectValue placeholder={t('filter.allStatuses')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>{t('filter.allStatuses')}</SelectItem>
                    <SelectItem value='DRAFT'>{tStatus('draft')}</SelectItem>
                    <SelectItem value='PENDING_SIGNATURE'>{tStatus('pending_signature')}</SelectItem>
                    <SelectItem value='ACTIVE'>{tStatus('active')}</SelectItem>
                    <SelectItem value='EXPIRED'>{tStatus('expired')}</SelectItem>
                    <SelectItem value='TERMINATED'>{tStatus('terminated')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='relative w-full flex-1'>
                <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60' />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={t('filter.searchPlaceholder')}
                  className='h-10 rounded-xl border-transparent bg-[#F5F3FF] pl-9 text-sm focus-visible:ring-primary/20'
                />
              </div>
            </div>

            <div className='overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_18px_48px_rgba(96,72,179,0.10)]'>
              <div className='grid grid-cols-12 gap-4 border-b border-primary/20 bg-secondary px-5 py-4'>
                <div className='col-span-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70'>
                  {t('table.status')}
                </div>
                <div className='col-span-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70'>
                  {t('table.tenant')}
                </div>
                <div className='col-span-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70'>
                  {t('table.monthlyRent')}
                </div>
                <div className='col-span-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70'>
                  {t('table.createdDate')}
                </div>
              </div>

              <div className='min-h-[420px]'>
                {contracts.length === 0 ? (
                  <div className='flex h-[420px] flex-col items-center justify-center gap-4 px-6 text-center'>
                    <div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10'>
                      <FileSearch className='h-8 w-8 text-primary/70' />
                    </div>
                    <div>
                      <p className='font-semibold text-foreground'>{t('empty.title')}</p>
                      <p className='mt-1 text-sm text-muted-foreground'>{t('empty.subtitle')}</p>
                    </div>
                  </div>
                ) : (
                  <div className='divide-y divide-primary/10'>
                    {contracts.map((contract) => (
                      <ContractListItem
                        key={contract.id}
                        contract={contract}
                        isSelected={selectedContract?.id === contract.id}
                        onClick={handleContractClick}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {totalElements > 0 && (
              <div className='mt-4 flex items-center justify-between px-1'>
                <p className='text-xs font-medium text-muted-foreground'>
                  {t('pagination.showing', {
                    from: Math.min((currentPage - 1) * itemsPerPage + 1, totalElements),
                    to: Math.min(currentPage * itemsPerPage, totalElements),
                    total: totalElements,
                  })}
                </p>

                <div className='flex items-center gap-1'>
                  <Button
                    variant='outline'
                    size='icon'
                    className='h-9 w-9 rounded-xl border-primary/20 bg-white hover:border-primary hover:bg-primary/5 hover:text-primary'
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className='h-4 w-4' />
                  </Button>
                  <span className='px-3 text-sm font-semibold tabular-nums text-foreground'>
                    {currentPage}
                    <span className='mx-1.5 font-normal text-secondary/35'>/</span>
                    {totalPages}
                  </span>
                  <Button
                    variant='outline'
                    size='icon'
                    className='h-9 w-9 rounded-xl border-primary/20 bg-white hover:border-primary hover:bg-primary/5 hover:text-primary'
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <ChevronRight className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {selectedContract && (
            <ContractDetailPanel
              contract={selectedContract}
              onClose={() => setSelectedContract(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function ManageRentalContractPage() {
  return (
    <ManageRentalContractProvider>
      <ManageRentalContractContent />
    </ManageRentalContractProvider>
  );
}
