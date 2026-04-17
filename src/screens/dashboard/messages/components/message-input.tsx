'use client';

import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, FileText, Mic, Send, Loader2, AlertTriangle, Building2, User, Check, X } from 'lucide-react';
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
import { listingApi } from '@/entities/listing';
import { extractListingId } from '@/entities/listing';
import type { ListingData } from '@/entities/listing/model/types';

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

// ── Listing URL detection ─────────────────────────────────────────────────────

/**
 * Returns the listing slug if the text is (or contains) a listing detail URL,
 * otherwise returns null.
 * Matches: /{locale}/listing/{slug}  (absolute or relative, with/without origin)
 */
function detectListingSlug(text: string): string | null {
  const trimmed = text.trim();
  // Match /en/listing/some-slug or /vi/listing/some-slug (and with https://... prefix)
  const match = trimmed.match(/\/[a-z]{2}\/listing\/([^\s?#]+)/);
  return match?.[1] ?? null;
}

/** Map a full ListingData API object to the compact ChatListingData shape */
function toCardData(listing: ListingData): ChatListingData {
  const primaryMedia =
    listing.media?.find((m) => m.is_primary) ?? listing.media?.[0];

  const beds = listing.attributes?.find((a) => a.attribute_code === 'bedrooms')?.value_number;
  const bathrooms = listing.attributes?.find((a) => a.attribute_code === 'bathrooms')?.value_number;

  const addressParts = [
    listing.location?.ward_name,
    listing.location?.district_name,
    listing.location?.city_name,
  ].filter(Boolean);

  return {
    id: listing.listing_id,
    title: listing.name,
    slug: listing.slug,
    image: primaryMedia?.media_url ?? '',
    price: listing.price,
    address: addressParts.join(', '),
    beds: beds ?? undefined,
    bathrooms: bathrooms ?? undefined,
    area: listing.property?.usable_size_m2 ?? undefined,
    ownerId: listing.user_id ?? undefined,
    agentId: listing.agent?.user_id ?? undefined,
    listingStatus: listing.status ?? undefined,
  };
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  /** Called instead of onSubmit when the pasted URL resolved to a listing card */
  onSubmitListingCard: (listing: ChatListingData) => void;
  onTyping?: () => void;
  isSending?: boolean;
  isConnected?: boolean;
  /** ID of the other conversation participant — used to pre-fill tenant in contract wizard */
  otherUserId?: string;
  /** Display name of the other participant */
  otherUserName?: string;
  /** All unique listing cards found in this conversation */
  listings?: ChatListingData[];
  /**
   * When set, the modal opens immediately with this listing pre-selected.
   * Parent must reset to null after opening.
   */
  pendingListing?: ChatListingData | null;
  onPendingListingConsumed?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MessageInput({
  value,
  onChange,
  onSubmit,
  onSubmitListingCard,
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

  // ── Popover / modal state ─────────────────────────────────────────────────
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<ChatListingData | null>(
    listings[0] ?? null
  );
  const popoverRef = useRef<HTMLDivElement>(null);
  const plusBtnRef = useRef<HTMLButtonElement>(null);

  // ── Listing URL preview state ─────────────────────────────────────────────
  /** The resolved slug from the pasted URL (drives the fetch) */
  const [detectedSlug, setDetectedSlug] = useState<string | null>(null);
  /** true once user explicitly dismissed the preview for this input value */
  const [previewDismissed, setPreviewDismissed] = useState(false);
  /** The fully resolved card data (set when fetch succeeds) */
  const [resolvedCard, setResolvedCard] = useState<ChatListingData | null>(null);
  /** Raw API data — kept to check ownership against conversation participants */
  const [rawListingData, setRawListingData] = useState<ListingData | null>(null);
  /** Fetch error flag */
  const [cardFetchError, setCardFetchError] = useState(false);
  /** true when user clicked "Send anyway" on the unrelated-listing warning */
  const [sendAnywayConfirmed, setSendAnywayConfirmed] = useState(false);

  // ── Debounce: detect listing URL while user types ─────────────────────────
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const slug = detectListingSlug(value);
      if (!slug) {
        setDetectedSlug(null);
        setResolvedCard(null);
        setCardFetchError(false);
        setPreviewDismissed(false);
        return;
      }
      // Only re-trigger if the slug actually changed
      setDetectedSlug((prev) => (prev === slug ? prev : slug));
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  // Reset dismissed state when slug changes
  useEffect(() => {
    setPreviewDismissed(false);
    setResolvedCard(null);
    setRawListingData(null);
    setCardFetchError(false);
    setSendAnywayConfirmed(false);
  }, [detectedSlug]);

  // ── Fetch the listing when a slug is detected ─────────────────────────────
  const listingIdFromSlug = detectedSlug ? extractListingId(detectedSlug) : null;
  const [isFetchingCard, setIsFetchingCard] = useState(false);

  useEffect(() => {
    if (!listingIdFromSlug || previewDismissed) return;

    let cancelled = false;
    setIsFetchingCard(true);
    setCardFetchError(false);

    listingApi.getById(listingIdFromSlug).then((res) => {
      if (cancelled) return;
      const data: ListingData = (res as any)?.payload?.data ?? (res as any)?.data ?? res;
      if (data?.listing_id) {
        setRawListingData(data);
        setResolvedCard(toCardData(data));
      } else {
        setCardFetchError(true);
      }
      setIsFetchingCard(false);
    }).catch(() => {
      if (!cancelled) {
        setCardFetchError(true);
        setIsFetchingCard(false);
      }
    });

    return () => { cancelled = true; };
  }, [listingIdFromSlug, previewDismissed]);

  const showPreview = !!detectedSlug && !previewDismissed;

  // ── Ownership check ───────────────────────────────────────────────────────
  /**
   * True when the fetched listing belongs to neither the current user nor the
   * other conversation participant (agent.user_id or user_id).
   */
  const isUnrelatedListing = useMemo(() => {
    if (!rawListingData || !resolvedCard) return false;
    const ids = new Set([
      rawListingData.agent?.user_id,
      rawListingData.user_id,
    ].filter(Boolean));
    const currentUserId = (session?.user as any)?.id ?? '';
    return !ids.has(currentUserId) && !ids.has(otherUserId ?? '');
  }, [rawListingData, resolvedCard, session, otherUserId]);

  // ── Auth / role ───────────────────────────────────────────────────────────
  const canCreateContract =
    (session?.user?.backendRoles ?? []).includes('OWNER') ||
    (session?.user?.backendRoles ?? []).includes('AGENT');
  console.log('canCreateContract', canCreateContract);
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

  const existingContract: RentalContract | undefined = useMemo(() => {
    if (!selectedListing?.id || !otherUserId) return undefined;
    return allContracts.find(
      (c) => c.listing_id === selectedListing.id && c.tenant.id === otherUserId
    );
  }, [allContracts, selectedListing, otherUserId]);

  // ── Close popover when clicking outside ──────────────────────────────────
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

  // ── Send handler — routes to card send or plain text ─────────────────────
  const handleSend = useCallback(() => {
    if (!canSend) return;
    if (resolvedCard && showPreview) {
      // Block send if listing is unrelated and user hasn't explicitly confirmed
      if (isUnrelatedListing && !sendAnywayConfirmed) return;
      onSubmitListingCard(resolvedCard);
    } else {
      onSubmit();
    }
  }, [canSend, resolvedCard, showPreview, isUnrelatedListing, sendAnywayConfirmed, onSubmitListingCard, onSubmit]);

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

  const existingStatusLabel = existingContract
    ? t(STATUS_KEY_MAP[existingContract.status] as never)
    : '';

  return (
    <div className='border-primary/20 bg-white px-6 py-4'>
      {/* Offline banner */}
      {!isConnected && (
        <p className='mb-2 text-center text-xs text-muted-foreground'>{t('connecting')}</p>
      )}

      {/* ── Listing URL preview banner ────────────────────────────────────── */}
      {showPreview && (
        <div className='mb-3 overflow-hidden rounded-xl border border-primary/20 bg-primary/5'>
          {/* Header row */}
          <div className='flex items-center justify-between px-3 py-2'>
            <span className='text-xs font-semibold text-primary'>
              {t('listingPreview.label')}
            </span>
            <button
              type='button'
              onClick={() => setPreviewDismissed(true)}
              className='text-muted-foreground transition-colors hover:text-foreground'
              aria-label={t('listingPreview.dismiss')}
            >
              <X className='size-3.5' />
            </button>
          </div>

          {/* Content */}
          {isFetchingCard && (
            <div className='flex items-center gap-2 border-t border-primary/20 px-3 py-2'>
              <Loader2 className='size-3.5 animate-spin text-primary/60' />
              <span className='text-xs text-muted-foreground'>{t('listingPreview.fetching')}</span>
            </div>
          )}

          {!isFetchingCard && cardFetchError && (
            <div className='flex items-center gap-2 border-t border-amber-200 bg-amber-50 px-3 py-2'>
              <AlertTriangle className='size-3.5 shrink-0 text-amber-500' />
              <span className='text-xs text-amber-700'>{t('listingPreview.error')}</span>
            </div>
          )}

          {!isFetchingCard && resolvedCard && (
            <div className='flex items-center gap-3 border-t border-primary/20 px-3 py-2'>
              {resolvedCard.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolvedCard.image}
                  alt={resolvedCard.title}
                  className='h-10 w-14 shrink-0 rounded-md object-cover'
                />
              )}
              <div className='min-w-0 flex-1'>
                <p className='truncate text-xs font-semibold text-foreground'>{resolvedCard.title}</p>
                <p className='truncate text-xs text-muted-foreground'>{resolvedCard.address}</p>
              </div>
              <span className='shrink-0 text-xs font-bold text-primary'>
                {resolvedCard.price?.toLocaleString()}
              </span>
            </div>
          )}

          {/* Unrelated listing warning */}
          {!isFetchingCard && resolvedCard && isUnrelatedListing && !sendAnywayConfirmed && (
            <div className='flex items-center justify-between gap-2 border-t border-amber-200 bg-amber-50 px-3 py-2'>
              <div className='flex min-w-0 items-center gap-2'>
                <AlertTriangle className='size-3.5 shrink-0 text-amber-500' />
                <span className='text-xs text-amber-700'>{t('listingPreview.unrelatedWarning')}</span>
              </div>
              <button
                type='button'
                onClick={() => setSendAnywayConfirmed(true)}
                className='shrink-0 text-xs font-semibold text-amber-700 underline underline-offset-2 transition-colors hover:text-amber-900'
              >
                {t('listingPreview.sendAnyway')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Input row ────────────────────────────────────────────────────── */}
      <div className='flex items-center gap-3 rounded-2xl border border-primary/20 bg-white px-4 py-3 shadow-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10'>
        {/* Plus button with popover — only rendered for owner / AGENT */}
        {canCreateContract && (
          <div className='relative shrink-0'>
            <button
              ref={plusBtnRef}
              onClick={() => setPopoverOpen((v) => !v)}
              className={cn(
                'flex size-5 items-center justify-center rounded-full transition-colors',
                popoverOpen ? 'bg-primary text-white' : 'text-muted-foreground hover:text-primary'
              )}
              aria-label='More actions'
            >
              <Plus className='size-4' />
            </button>

            {popoverOpen && (
              <div
                ref={popoverRef}
                className='absolute bottom-full left-0 mb-2 w-52 overflow-hidden rounded-xl border border-primary/20 bg-white shadow-lg'
              >
                <button
                  onClick={() => {
                    setPopoverOpen(false);
                    setSelectedListing(listings[0] ?? null);
                    setModalOpen(true);
                  }}
                  className='flex w-full items-center gap-2.5 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-primary/5'
                >
                  <FileText className='size-4 shrink-0 text-primary' />
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
              handleSend();
            }
          }}
          className='flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50'
        />

        {/* Send / Mic button */}
        {canSend ? (
          <button
            onClick={handleSend}
            disabled={isSending}
            className='shrink-0 text-primary transition-colors hover:text-primary/70 disabled:opacity-50'
            aria-label='Send message'
          >
            {isSending ? <Loader2 className='size-5 animate-spin' /> : <Send className='size-5' />}
          </button>
        ) : (
          <button className='shrink-0 text-muted-foreground transition-colors hover:text-primary'>
            <Mic className='size-5' />
          </button>
        )}
      </div>

      {/* ── Confirmation modal ──────────────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className='max-w-md' showCloseButton>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-foreground'>
              <FileText className='size-5 text-primary' />
              {t('contractModal.title')}
            </DialogTitle>
            <DialogDescription className='text-sm text-secondary/65'>
              {t('contractModal.description')}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-3 py-1'>
            {/* Listing picker — shown when conversation has multiple listings */}
            {listings.length > 1 && (
              <div className='space-y-2'>
                <p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary/50'>
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
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                            : 'border-primary/20 bg-white hover:border-primary/40 hover:bg-primary/5'
                        )}
                      >
                        <Building2
                          className={cn(
                            'size-4 shrink-0',
                            isSelected ? 'text-primary' : 'text-secondary/40'
                          )}
                        />
                        <div className='min-w-0 flex-1'>
                          <p className='truncate text-sm font-medium text-foreground'>
                            {listing.title}
                          </p>
                          <p className='truncate text-xs text-muted-foreground'>{listing.address}</p>
                        </div>
                        {isSelected && <Check className='size-4 shrink-0 text-primary' />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Single listing row */}
            {listings.length <= 1 && (
              <div className='flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3'>
                <Building2 className='mt-0.5 size-4 shrink-0 text-primary/70' />
                <div className='min-w-0 flex-1'>
                  <p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary/50'>
                    {t('contractModal.listingLabel')}
                  </p>
                  <p className='mt-0.5 truncate text-sm font-medium text-foreground'>
                    {selectedListing?.title ?? selectedListing?.id ?? t('contractModal.noListing')}
                  </p>
                </div>
              </div>
            )}

            {/* Tenant row */}
            <div className='flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3'>
              <User className='mt-0.5 size-4 shrink-0 text-primary/70' />
              <div className='min-w-0 flex-1'>
                <p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary/50'>
                  {t('contractModal.tenantLabel')}
                </p>
                <p className='mt-0.5 truncate text-sm font-medium text-foreground'>
                  {otherUserName ?? t('contractModal.noTenant')}
                </p>
              </div>
            </div>

            {/* Existing contract warning */}
            {contractsLoading && (
              <div className='flex items-center justify-center py-2'>
                <Loader2 className='size-4 animate-spin text-primary/60' />
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
              className='rounded-xl border-primary/30'
            >
              {t('contractModal.cancel')}
            </Button>
            <Button
              onClick={navigateToWizard}
              disabled={contractsLoading || !selectedListing}
              className='rounded-xl bg-primary text-white hover:bg-primary/90'
            >
              {t('contractModal.proceed')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
