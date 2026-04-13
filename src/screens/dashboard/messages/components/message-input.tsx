'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { Plus, FileText, Mic, Send, Loader2, AlertTriangle, Building2, User, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/shared/lib/utils';
import { useAuthSession } from '@/features/auth/model';
import { useRouter } from '@/shared/config/i18n/navigation';
import { ROUTES } from '@/shared/config/routes';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@/shared/ui';
import {
  rentalContractQueries,
  RentalContractStatus,
  type RentalContract,
} from '@/entities/rental-contract';
import type { ChatListingData } from '@/entities/contact';

// ── Status label helper ────────────────────────────────────────────────────────

const STATUS_KEY_MAP: Record<RentalContractStatus, string> = {
  [RentalContractStatus.DRAFT]: 'contractModal.statusDraft',
  [RentalContractStatus.PENDING_RENTER]: 'contractModal.statusPendingRenter',
  [RentalContractStatus.PENDING_LANDLORD]: 'contractModal.statusPendingLandlord',
  [RentalContractStatus.ACTIVE]: 'contractModal.statusActive',
  [RentalContractStatus.EXPIRED]: 'contractModal.statusExpired',
  [RentalContractStatus.TERMINATED]: 'contractModal.statusTerminated',
  [RentalContractStatus.REJECTED]: 'contractModal.statusRejected',
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onTyping?: () => void;
  isSending?: boolean;
  isConnected?: boolean;
  /** ID of the other conversation participant — used to pre-fill tenant in contract wizard */
  otherUserId?: string;
  /** Display name of the other participant */
  otherUserName?: string;
  /**
   * All unique listing cards found in this conversation.
   * The modal will show a picker when there are multiple listings.
   */
  listings?: ChatListingData[];
  /**
   * When set, the modal will open immediately with this listing pre-selected.
   * Used when the user clicks "Create Contract" directly on a listing card.
   * Parent must reset this to null after opening the modal.
   */
  pendingListing?: ChatListingData | null;
  /** Called when the modal auto-opens due to pendingListing so parent can reset state */
  onPendingListingConsumed?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MessageInput({
  value,
  onChange,
  onSubmit,
  onTyping,
  isSending = false,
  isConnected = false,
  otherUserId,
  otherUserName,
  listings = [],
  pendingListing,
  onPendingListingConsumed,
}: MessageInputProps) {
  const t = useTranslations('Messages');
  const { data: session } = useAuthSession();
  const router = useRouter();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<ChatListingData | null>(
    listings[0] ?? null
  );
  const popoverRef = useRef<HTMLDivElement>(null);
  const plusBtnRef = useRef<HTMLButtonElement>(null);

  // Only owner and AGENT may see contract creation
  const canCreateContract =
    session?.user?.role === 'owner' || session?.user?.backendRoles?.includes('AGENT');

  const landlordId = (session?.user as any)?.id ?? '';

  // ── Auto-open modal when a pending listing is set from a card button ──────
  useEffect(() => {
    if (pendingListing) {
      setSelectedListing(pendingListing);
      setModalOpen(true);
      onPendingListingConsumed?.();
    }
  }, [pendingListing, onPendingListingConsumed]);

  // ── Sync selectedListing default when listings change ────────────────────
  useEffect(() => {
    if (!selectedListing && listings.length > 0) {
      setSelectedListing(listings[0]);
    }
  }, [listings, selectedListing]);

  // ── Fetch landlord contracts — only when modal is open ────────────────────
  const { data: contractsData, isLoading: contractsLoading } = useQuery({
    ...rentalContractQueries.list({ landlordId, page: 0, size: 100 }),
    enabled: modalOpen && !!landlordId,
  });

  const allContracts: RentalContract[] = useMemo(() => {
    return (
      (contractsData as any)?.payload?.data?.content ??
      (contractsData as any)?.data?.content ??
      []
    );
  }, [contractsData]);

  // Find any existing contract for the currently selected listing + tenant pair
  const existingContract: RentalContract | undefined = useMemo(() => {
    if (!selectedListing?.id || !otherUserId) return undefined;
    return allContracts.find(
      (c) => c.listing_id === selectedListing.id && c.tenant.id === otherUserId
    );
  }, [allContracts, selectedListing, otherUserId]);

  // Close popover when clicking outside
  useEffect(() => {
    if (!popoverOpen) return;

    function handleOutsideClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        plusBtnRef.current &&
        !plusBtnRef.current.contains(e.target as Node)
      ) {
        setPopoverOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [popoverOpen]);

  const canSend = value.trim().length > 0 && !isSending;

  // ── Navigate to wizard ────────────────────────────────────────────────────
  function navigateToWizard() {
    setModalOpen(false);
    const params = new URLSearchParams();
    if (otherUserId) params.set('tenantUserId', otherUserId);
    if (otherUserName) params.set('tenantName', otherUserName);
    if (selectedListing?.id) params.set('listingId', selectedListing.id);
    const query = params.toString();
    router.push(`${ROUTES.dashboard.createRentalContract}${query ? `?${query}` : ''}`);
  }

  // ── Existing contract status label ────────────────────────────────────────
  const existingStatusLabel = existingContract
    ? t(STATUS_KEY_MAP[existingContract.status] as never)
    : '';

  return (
    <div className='border-t border-purple-92/50 bg-white px-6 py-4'>
      {/* Offline banner */}
      {!isConnected && (
        <p className='mb-2 text-center text-xs text-grey-400'>{t('connecting')}</p>
      )}
      <div className='flex items-center gap-3 rounded-2xl border border-purple-92 bg-white px-4 py-3 shadow-sm focus-within:border-main-primary/50 focus-within:ring-2 focus-within:ring-main-primary/10'>
        {/* Plus button with popover — only rendered for owner / AGENT */}
        {canCreateContract && (
          <div className='relative shrink-0'>
            <button
              ref={plusBtnRef}
              onClick={() => setPopoverOpen((v) => !v)}
              className={cn(
                'flex size-5 items-center justify-center rounded-full transition-colors',
                popoverOpen ? 'bg-main-primary text-white' : 'text-grey-400 hover:text-main-primary'
              )}
              aria-label='More actions'
            >
              <Plus className='size-4' />
            </button>

            {popoverOpen && (
              <div
                ref={popoverRef}
                className='absolute bottom-full left-0 mb-2 w-52 overflow-hidden rounded-xl border border-purple-92 bg-white shadow-lg'
              >
                <button
                  onClick={() => {
                    setPopoverOpen(false);
                    // Reset to first listing when opening from + menu
                    setSelectedListing(listings[0] ?? null);
                    setModalOpen(true);
                  }}
                  className='flex w-full items-center gap-2.5 px-4 py-3 text-sm font-medium text-main-black transition-colors hover:bg-purple-98'
                >
                  <FileText className='size-4 shrink-0 text-main-primary' />
                  {t('createContract')}
                </button>
              </div>
            )}
          </div>
        )}

        <input
          type='text'
          placeholder={t('typeYourMessage')}
          value={value}
          disabled={isSending}
          onChange={(e) => {
            onChange(e.target.value);
            onTyping?.();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canSend) {
              onSubmit();
            }
          }}
          className='flex-1 bg-transparent text-sm text-main-black placeholder:text-grey-400 focus:outline-none disabled:opacity-50'
        />

        {/* Send / Mic button */}
        {canSend ? (
          <button
            onClick={onSubmit}
            disabled={isSending}
            className='shrink-0 text-main-primary transition-colors hover:text-main-primary/70 disabled:opacity-50'
            aria-label='Send message'
          >
            {isSending ? <Loader2 className='size-5 animate-spin' /> : <Send className='size-5' />}
          </button>
        ) : (
          <button className='shrink-0 text-grey-400 transition-colors hover:text-main-primary'>
            <Mic className='size-5' />
          </button>
        )}
      </div>

      {/* ── Confirmation modal ──────────────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className='max-w-md' showCloseButton>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-main-black'>
              <FileText className='size-5 text-main-primary' />
              {t('contractModal.title')}
            </DialogTitle>
            <DialogDescription className='text-sm text-main-secondary/65'>
              {t('contractModal.description')}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-3 py-1'>
            {/* ── Listing picker — shown when conversation has multiple listings ── */}
            {listings.length > 1 && (
              <div className='space-y-2'>
                <p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-main-secondary/50'>
                  {t('contractModal.listingPickerLabel')}
                </p>
                <div className='max-h-52 space-y-1.5 overflow-y-auto pr-0.5'>
                  {listings.map((listing) => {
                    const isSelected = selectedListing?.id === listing.id;
                    return (
                      <button
                        key={listing.id}
                        type='button'
                        onClick={() => setSelectedListing(listing)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-all',
                          isSelected
                            ? 'border-main-primary bg-[#FBF9FF] ring-1 ring-main-primary/30'
                            : 'border-[#EAE1FF] bg-white hover:border-main-primary/40 hover:bg-[#FBF9FF]/60'
                        )}
                      >
                        <Building2
                          className={cn(
                            'size-4 shrink-0',
                            isSelected ? 'text-main-primary' : 'text-main-secondary/40'
                          )}
                        />
                        <div className='min-w-0 flex-1'>
                          <p className='truncate text-sm font-medium text-main-black'>
                            {listing.title}
                          </p>
                          <p className='truncate text-xs text-grey-400'>{listing.address}</p>
                        </div>
                        {isSelected && (
                          <Check className='size-4 shrink-0 text-main-primary' />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Pre-fill summary ── */}
            {/* Listing row (single listing or no picker) */}
            {listings.length <= 1 && (
              <div className='flex items-start gap-3 rounded-2xl border border-[#EAE1FF] bg-[#FBF9FF] px-4 py-3'>
                <Building2 className='mt-0.5 size-4 shrink-0 text-main-primary/70' />
                <div className='min-w-0 flex-1'>
                  <p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-main-secondary/50'>
                    {t('contractModal.listingLabel')}
                  </p>
                  <p className='mt-0.5 truncate text-sm font-medium text-main-black'>
                    {selectedListing?.title ?? selectedListing?.id ?? t('contractModal.noListing')}
                  </p>
                </div>
              </div>
            )}

            {/* Tenant row */}
            <div className='flex items-start gap-3 rounded-2xl border border-[#EAE1FF] bg-[#FBF9FF] px-4 py-3'>
              <User className='mt-0.5 size-4 shrink-0 text-main-primary/70' />
              <div className='min-w-0 flex-1'>
                <p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-main-secondary/50'>
                  {t('contractModal.tenantLabel')}
                </p>
                <p className='mt-0.5 truncate text-sm font-medium text-main-black'>
                  {otherUserName ?? t('contractModal.noTenant')}
                </p>
              </div>
            </div>

            {/* Existing contract warning */}
            {contractsLoading && (
              <div className='flex items-center justify-center py-2'>
                <Loader2 className='size-4 animate-spin text-main-primary/60' />
              </div>
            )}

            {!contractsLoading && existingContract && (
              <div className='flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3'>
                <AlertTriangle className='mt-0.5 size-4 shrink-0 text-amber-500' />
                <div>
                  <p className='text-sm font-semibold text-amber-800'>
                    {t('contractModal.existingWarningTitle')}
                  </p>
                  <p className='mt-0.5 text-sm leading-5 text-amber-700'>
                    {(t('contractModal.existingWarningBody') as string).replace(
                      '{status}',
                      existingStatusLabel
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className='gap-2'>
            <Button
              variant='outline'
              onClick={() => setModalOpen(false)}
              className='rounded-xl border-[#DDD2FF]'
            >
              {t('contractModal.cancel')}
            </Button>
            <Button
              onClick={navigateToWizard}
              disabled={contractsLoading || !selectedListing}
              className='rounded-xl bg-main-primary text-white hover:bg-main-primary/90'
            >
              {t('contractModal.proceed')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
