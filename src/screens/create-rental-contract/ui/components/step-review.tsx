import Image from 'next/image';
import { Bath, BedDouble, Building2, MapPin, SendHorizontal } from 'lucide-react';
import { Badge } from '@/shared/ui';
import { formatCurrencyValue } from './shared';

interface ReviewFormSnapshot {
  thumbnailUrl: string;
  propertyTitle: string;
  propertyAddress: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  tenantName: string;
  tenantEmail: string;
  monthlyRent: string;
  securityDeposit: string;
  leaseStartDate: string;
  leaseEndDate: string;
}

interface StepReviewProps {
  form: ReviewFormSnapshot;
  t: (key: string, values?: Record<string, unknown>) => string;
}

export function StepReview({ form, t }: StepReviewProps) {
  const leaseDurationMonths = (() => {
    if (!form.leaseStartDate || !form.leaseEndDate) return 0;
    const start = new Date(form.leaseStartDate);
    const end = new Date(form.leaseEndDate);
    return Math.max(
      0,
      (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
    );
  })();

  return (
    <div className='space-y-4'>
      {/* Property banner */}
      <div className='flex items-center gap-4 rounded-2xl border border-[#E7E0FF] bg-[#FDFBFF] p-4'>
        {form.thumbnailUrl ? (
          <Image
            src={form.thumbnailUrl}
            alt={form.propertyTitle}
            width={80}
            height={80}
            className='h-20 w-20 shrink-0 rounded-xl object-cover'
          />
        ) : (
          <div className='flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-[#F3EEFF]'>
            <Building2 className='h-6 w-6 text-main-primary/50' />
          </div>
        )}
        <div className='min-w-0'>
          <p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-main-secondary/50'>
            {t('review.propertyBanner')}
          </p>
          <p className='mt-1 text-lg font-semibold tracking-[-0.02em] text-main-black'>
            {form.propertyTitle}
          </p>
          <div className='mt-1.5 flex flex-wrap items-center gap-2'>
            <span className='flex items-center gap-1 text-xs text-main-secondary/60'>
              <MapPin className='h-3 w-3' />
              {form.propertyAddress}
            </span>
            <Badge
              variant='secondary'
              className='rounded-full bg-[#F3EEFF] px-2.5 py-0.5 text-[11px] font-medium text-main-primary/80'
            >
              {form.propertyType}
            </Badge>
            {form.bedrooms && (
              <span className='flex items-center gap-1 text-xs text-main-secondary/60'>
                <BedDouble className='h-3 w-3' /> {form.bedrooms}
              </span>
            )}
            {form.bathrooms && (
              <span className='flex items-center gap-1 text-xs text-main-secondary/60'>
                <Bath className='h-3 w-3' /> {form.bathrooms}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Parties + Financials */}
      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='rounded-2xl border border-[#E7E0FF] bg-[#FDFBFF] p-4'>
          <p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-main-secondary/50'>
            {t('review.partiesTitle')}
          </p>
          <div className='mt-3 space-y-3'>
            <div>
              <p className='text-xs text-main-secondary/50'>{t('review.ownerLabel')}</p>
              <p className='mt-0.5 text-sm font-medium text-main-black'>{t('review.ownerYou')}</p>
            </div>
            <div className='h-px bg-[#F0E8FF]' />
            <div>
              <p className='text-xs text-main-secondary/50'>{t('review.tenantLabel')}</p>
              <p className='mt-0.5 text-sm font-medium text-main-black'>{form.tenantName}</p>
              <p className='text-xs text-main-secondary/50'>{form.tenantEmail}</p>
            </div>
          </div>
        </div>

        <div className='rounded-2xl border border-[#E7E0FF] bg-[#FDFBFF] p-4'>
          <p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-main-secondary/50'>
            {t('review.financialsTitle')}
          </p>
          <div className='mt-3 space-y-3'>
            <div>
              <p className='text-xs text-main-secondary/50'>{t('review.monthlyRentLabel')}</p>
              <p className='mt-0.5 text-lg font-semibold text-main-black'>
                {formatCurrencyValue(form.monthlyRent)}
              </p>
            </div>
            <div className='h-px bg-[#F0E8FF]' />
            <div>
              <p className='text-xs text-main-secondary/50'>{t('review.depositLabel')}</p>
              <p className='mt-0.5 text-sm font-medium text-main-black'>
                {form.securityDeposit
                  ? formatCurrencyValue(form.securityDeposit)
                  : t('review.noDeposit')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lease timeline */}
      <div className='rounded-2xl border border-[#E7E0FF] bg-[#FDFBFF] p-4'>
        <p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-main-secondary/50'>
          {t('review.timelineTitle')}
        </p>
        <div className='mt-3 flex items-center gap-3'>
          <div className='rounded-xl bg-[#F3EEFF] px-3 py-2 text-center'>
            <p className='text-[10px] font-medium uppercase text-main-secondary/50'>
              {t('review.timelineFrom')}
            </p>
            <p className='mt-0.5 text-sm font-semibold text-main-black'>{form.leaseStartDate}</p>
          </div>
          <div className='flex flex-1 items-center gap-2'>
            <div className='h-px flex-1 bg-[#E7E0FF]' />
            {leaseDurationMonths > 0 && (
              <span className='shrink-0 rounded-full bg-main-primary/10 px-3 py-1 text-xs font-semibold text-main-primary'>
                {t('review.timelineDuration', { months: leaseDurationMonths })}
              </span>
            )}
            <div className='h-px flex-1 bg-[#E7E0FF]' />
          </div>
          <div className='rounded-xl bg-[#F3EEFF] px-3 py-2 text-center'>
            <p className='text-[10px] font-medium uppercase text-main-secondary/50'>
              {t('review.timelineTo')}
            </p>
            <p className='mt-0.5 text-sm font-semibold text-main-black'>{form.leaseEndDate}</p>
          </div>
        </div>
      </div>

      {/* DocuSign notice */}
      <div className='flex items-center gap-3 rounded-2xl border border-dashed border-[#D7CFFF] bg-[#FAF8FF] px-4 py-3'>
        <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-main-primary/10'>
          <SendHorizontal className='h-4 w-4 text-main-primary' />
        </div>
        <p className='text-sm leading-relaxed text-main-secondary/70'>{t('review.docusignNotice')}</p>
      </div>
    </div>
  );
}
