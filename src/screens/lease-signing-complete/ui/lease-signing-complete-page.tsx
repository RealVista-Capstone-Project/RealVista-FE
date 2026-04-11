'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  CheckCircle2,
  ArrowLeft,
  FileText,
  AlertCircle,
  Loader2,
  Send,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Link } from '@/shared/config/i18n/navigation';
import { ROUTES } from '@/shared/config/routes';
import {
  useConfirmLandlordSignedMutation,
  useSendToRenterMutation,
} from '@/features/rental-contract/hooks/use-rental-contracts';
import { DocuSignSigningModal } from '@/features/rental-contract/ui/docusign-signing-modal';

type LandlordConfirmState = 'confirming' | 'confirmed' | 'confirm_error';

export function LeaseSigningCompletePage() {
  const t = useTranslations('LeaseSigningComplete');
  const searchParams = useSearchParams();
  const leaseId = searchParams?.get('leaseId');
  const event = searchParams?.get('event');
  const role = searchParams?.get('role');

  // No event param = direct nav (dev/test); treat as success
  const isSuccess = !event || event === 'signing_complete';
  const isRenter = role === 'renter';
  const isLandlord = role === 'landlord';

  // ── Landlord confirm state machine ────────────────────────────────────────
  const [confirmState, setConfirmState] = useState<LandlordConfirmState>('confirming');
  const [renterSigningUrl, setRenterSigningUrl] = useState<string | null>(null);
  const [sendError, setSendError] = useState(false);

  const confirmMutation = useConfirmLandlordSignedMutation();
  const sendToRenterMutation = useSendToRenterMutation();

  const runConfirm = () => {
    if (!leaseId || !isLandlord || !isSuccess) return;
    setConfirmState('confirming');
    confirmMutation.mutate(leaseId, {
      onSuccess: () => setConfirmState('confirmed'),
      onError: () => setConfirmState('confirm_error'),
    });
  };

  // Auto-call confirm on mount (landlord path only)
  useEffect(() => {
    if (isLandlord && isSuccess && leaseId) {
      runConfirm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendToRenter = async () => {
    if (!leaseId) return;
    setSendError(false);
    try {
      const returnUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/leases/signing-complete?leaseId=${leaseId}&role=renter`
          : undefined;
      const data = await sendToRenterMutation.mutateAsync({ leaseId, returnUrl });
      if (data.signing_url) {
        setRenterSigningUrl(data.signing_url);
      }
    } catch {
      setSendError(true);
    }
  };

  // ── Step lists ────────────────────────────────────────────────────────────
  const landlordSteps = [
    { done: true, label: t('steps.landlordSigned') },
    { done: false, label: t('steps.waitingRenter') },
    { done: false, label: t('steps.contractActive') },
  ];

  const renterSteps = [
    { done: true, label: t('renter.steps.landlordSigned') },
    { done: true, label: t('renter.steps.youSigned') },
    { done: false, label: t('renter.steps.contractActive') },
  ];

  const steps = isRenter ? renterSteps : landlordSteps;

  // ── Render helpers ────────────────────────────────────────────────────────
  const renderSteps = () => (
    <div className='space-y-2.5'>
      {steps.map((step, i) => (
        <div key={i} className='flex items-center gap-3'>
          <div
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
              step.done
                ? 'bg-emerald-500 text-white'
                : 'bg-[#EDE8FF] text-main-secondary/50'
            }`}
          >
            {step.done ? '✓' : i + 1}
          </div>
          <span
            className={`text-sm ${
              step.done ? 'font-semibold text-main-black' : 'text-main-secondary/55'
            }`}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );

  // ── Landlord: confirming spinner ──────────────────────────────────────────
  if (isLandlord && isSuccess && confirmState === 'confirming') {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(120,80,255,0.10),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(39,197,255,0.08),transparent_22%),linear-gradient(180deg,#F7F4FF_0%,#FBFAFF_100%)]'>
        <div className='mx-auto w-full max-w-md px-6'>
          <div className='overflow-hidden rounded-3xl border border-[#E9E0FF] bg-white shadow-[0_32px_80px_rgba(92,63,214,0.14)]'>
            <div className='bg-[linear-gradient(135deg,#6B46C1,#4F46E5)] px-8 pb-8 pt-10 text-center'>
              <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm'>
                <Loader2 className='h-8 w-8 animate-spin text-white' />
              </div>
              <h1 className='mt-5 text-2xl font-semibold tracking-[-0.02em] text-white'>
                {t('title')}
              </h1>
              <p className='mt-2 text-sm leading-6 text-white/75'>
                {t('landlord.confirming')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Landlord: confirm error ───────────────────────────────────────────────
  if (isLandlord && isSuccess && confirmState === 'confirm_error') {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(120,80,255,0.10),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(39,197,255,0.08),transparent_22%),linear-gradient(180deg,#F7F4FF_0%,#FBFAFF_100%)]'>
        <div className='mx-auto w-full max-w-md px-6'>
          <div className='overflow-hidden rounded-3xl border border-[#E9E0FF] bg-white shadow-[0_32px_80px_rgba(92,63,214,0.14)]'>
            <div className='bg-[linear-gradient(135deg,#78350F,#B45309)] px-8 pb-8 pt-10 text-center'>
              <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm'>
                <AlertCircle className='h-8 w-8 text-white' />
              </div>
              <h1 className='mt-5 text-2xl font-semibold tracking-[-0.02em] text-white'>
                {t('error.title')}
              </h1>
              <p className='mt-2 text-sm leading-6 text-white/75'>
                {t('landlord.confirmError')}
              </p>
            </div>
            <div className='space-y-3 px-8 py-7'>
              <Button
                type='button'
                className='h-11 w-full rounded-xl bg-main-primary text-white shadow-[0_14px_28px_rgba(92,63,214,0.22)] hover:bg-main-primary-hover'
                onClick={runConfirm}
              >
                <RefreshCw className='h-4 w-4' />
                {t('landlord.confirmRetry')}
              </Button>
              <Button
                asChild
                variant='outline'
                className='h-11 w-full rounded-xl border-[#DDD2FF] text-main-secondary/70 hover:bg-[#F8F4FF]'
              >
                <Link href={ROUTES.dashboard.rentalContracts}>
                  <ArrowLeft className='h-4 w-4' />
                  {t('backButton')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main card ─────────────────────────────────────────────────────────────
  return (
    <div className='flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(120,80,255,0.10),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(39,197,255,0.08),transparent_22%),linear-gradient(180deg,#F7F4FF_0%,#FBFAFF_100%)]'>
      <div className='mx-auto w-full max-w-md px-6'>
        <div className='overflow-hidden rounded-3xl border border-[#E9E0FF] bg-white shadow-[0_32px_80px_rgba(92,63,214,0.14)]'>
          {isSuccess ? (
            <>
              {/* Success header */}
              <div className='bg-[linear-gradient(135deg,#6B46C1,#4F46E5)] px-8 pb-8 pt-10 text-center'>
                <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm'>
                  <CheckCircle2 className='h-8 w-8 text-white' />
                </div>
                <h1 className='mt-5 text-2xl font-semibold tracking-[-0.02em] text-white'>
                  {isRenter ? t('renter.title') : t('title')}
                </h1>
                <p className='mt-2 text-sm leading-6 text-white/75'>
                  {isRenter ? t('renter.subtitle') : t('subtitle')}
                </p>
              </div>

              {/* Success body */}
              <div className='space-y-4 px-8 py-7'>
                <div className='rounded-2xl border border-[#E5DFFC] bg-[#F8F5FF] px-4 py-4'>
                  <div className='flex items-start gap-3'>
                    <div className='mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-main-primary/10'>
                      <FileText className='h-4 w-4 text-main-primary' />
                    </div>
                    <div>
                      <p className='text-sm font-semibold text-main-black'>
                        {isRenter
                          ? t('renter.infoTitle')
                          : isLandlord
                            ? t('landlord.sendToRenterTitle')
                            : t('infoTitle')}
                      </p>
                      <p className='mt-1 text-sm leading-6 text-main-secondary/70'>
                        {isRenter
                          ? t('renter.infoBody')
                          : isLandlord
                            ? t('landlord.sendToRenterBody')
                            : t('infoBody')}
                      </p>
                      {leaseId && (
                        <p className='mt-2 text-xs font-mono text-main-secondary/45'>
                          {t('contractIdLabel')} {leaseId}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {renderSteps()}

                {/* Landlord: Send to Renter CTA */}
                {isLandlord && confirmState === 'confirmed' && (
                  <div className='space-y-2'>
                    {sendError && (
                      <p className='text-center text-xs text-red-500'>{t('landlord.sendError')}</p>
                    )}
                    <Button
                      type='button'
                      className='h-11 w-full rounded-xl bg-emerald-600 text-white shadow-[0_14px_28px_rgba(5,150,105,0.22)] hover:bg-emerald-700 disabled:opacity-60'
                      onClick={handleSendToRenter}
                      disabled={sendToRenterMutation.isPending}
                    >
                      {sendToRenterMutation.isPending ? (
                        <>
                          <Loader2 className='h-4 w-4 animate-spin' />
                          {t('landlord.sending')}
                        </>
                      ) : (
                        <>
                          <Send className='h-4 w-4' />
                          {t('landlord.sendToRenterButton')}
                        </>
                      )}
                    </Button>
                  </div>
                )}

                <Button
                  asChild
                  variant={isLandlord && confirmState === 'confirmed' ? 'outline' : 'default'}
                  className={
                    isLandlord && confirmState === 'confirmed'
                      ? 'h-11 w-full rounded-xl border-[#DDD2FF] text-main-secondary/70 hover:bg-[#F8F4FF]'
                      : 'mt-2 h-11 w-full rounded-xl bg-main-primary text-white shadow-[0_14px_28px_rgba(92,63,214,0.22)] hover:bg-main-primary-hover'
                  }
                >
                  <Link
                    href={
                      isRenter
                        ? ROUTES.dashboard.myContracts
                        : ROUTES.dashboard.rentalContracts
                    }
                  >
                    <ArrowLeft className='h-4 w-4' />
                    {isRenter ? t('renter.backButton') : t('backButton')}
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Error header */}
              <div className='bg-[linear-gradient(135deg,#78350F,#B45309)] px-8 pb-8 pt-10 text-center'>
                <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm'>
                  <AlertCircle className='h-8 w-8 text-white' />
                </div>
                <h1 className='mt-5 text-2xl font-semibold tracking-[-0.02em] text-white'>
                  {t('error.title')}
                </h1>
                <p className='mt-2 text-sm leading-6 text-white/75'>{t('error.subtitle')}</p>
              </div>

              {/* Error body */}
              <div className='px-8 py-7'>
                <Button
                  asChild
                  className='h-11 w-full rounded-xl bg-main-primary text-white shadow-[0_14px_28px_rgba(92,63,214,0.22)] hover:bg-main-primary-hover'
                >
                  <Link href={ROUTES.dashboard.rentalContracts}>
                    <ArrowLeft className='h-4 w-4' />
                    {t('error.backButton')}
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* DocuSign modal for renter — opened by landlord after Send to Renter */}
      {renterSigningUrl && (
        <DocuSignSigningModal
          open
          signingUrl={renterSigningUrl}
          signerRole='renter'
          onClose={() => setRenterSigningUrl(null)}
        />
      )}
    </div>
  );
}
