'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CalendarClock,
  ChevronRight,
  FileSignature,
  Heart,
  MessageSquareHeart,
  Sparkles,
} from 'lucide-react';

import { RealVistaButton } from '@/shared/ui/realvista-button';
import { ROUTES } from '@/shared/config/routes';
import { cn } from '@/shared/lib/utils';

type Step = { label: string; desc: string };

export function TenantNoContractsCTA() {
  const t = useTranslations('MyRentalContracts.emptyCta');
  const locale = useLocale();
  const router = useRouter();

  const steps = t.raw('steps') as Step[];

  const goToRent = () => router.push(`/${locale}${ROUTES.rent}`);
  const goToAppointments = () => router.push(`/${locale}${ROUTES.appointments}`);
  const goToFavorited = () => router.push(`/${locale}${ROUTES.favorited}`);

  return (
    <div className='flex min-h-screen flex-col'>
      <main className='mx-auto w-full max-w-4xl flex-1 space-y-10 px-6 py-10'>
        {/* Hero — flat, no card */}
        <div className='flex flex-col items-start gap-5'>
          <div className='flex size-12 items-center justify-center rounded-2xl bg-primary/10'>
            <FileSignature className='size-6 text-primary' />
          </div>
          <div>
            <h1 className='text-2xl font-bold tracking-tight text-gray-900'>{t('title')}</h1>
            <p className='mt-2 max-w-xl text-sm leading-6 text-gray-500'>{t('subtitle')}</p>
            {/* Inline note — sits tight under subtitle so tenants don't miss it */}
            <div className='mt-3 flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2'>
              <MessageSquareHeart className='mt-0.5 size-4 shrink-0 text-gray-400' />
              <p className='text-xs leading-5 text-gray-500'>{t('hint')}</p>
            </div>
          </div>
        </div>

        {/* How-it-works steps — numbered, light primary tint */}
        <div>
          <div className='mb-5 flex items-center gap-2'>
            <Sparkles className='size-4 text-primary' />
            <h2 className='text-sm font-semibold uppercase tracking-[0.18em] text-gray-500'>
              {t('stepsTitle')}
            </h2>
          </div>
          <ol className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
            {steps.map((step, index) => (
              <li
                key={step.label}
                className='relative flex flex-col gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-5'
              >
                <div className='flex items-center gap-3'>
                  <span className='flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white'>
                    {index + 1}
                  </span>
                  {index < steps.length - 1 && (
                    <span
                      aria-hidden
                      className='hidden h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent sm:block'
                    />
                  )}
                </div>
                <div>
                  <p className='text-sm font-semibold text-gray-900'>{step.label}</p>
                  <p className='mt-1 text-xs leading-5 text-gray-500'>{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Primary CTA banner — gradient + decorative blobs */}
        <div className='relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/80 px-8 py-10 shadow-[0_24px_60px_color-mix(in_oklch,var(--primary)_25%,transparent)]'>
          <div
            aria-hidden
            className='pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/15 blur-3xl'
          />
          <div
            aria-hidden
            className='pointer-events-none absolute -bottom-20 -left-10 size-48 rounded-full bg-white/10 blur-3xl'
          />
          <div className='relative flex flex-col items-center gap-4 text-center'>
            <h2 className='text-2xl font-bold text-white'>{t('ctaTitle')}</h2>
            <p className='max-w-md text-sm text-white/90'>{t('ctaSubtitle')}</p>
            <RealVistaButton
              variant='secondary'
              size='large'
              onClick={goToRent}
              className='mt-2 bg-white text-primary hover:bg-white/90'
            >
              {t('ctaButton')}
              <ArrowRight className='size-5' />
            </RealVistaButton>
          </div>
        </div>

        {/* Secondary quick actions — horizontal list (visually distinct from sell page) */}
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          <QuickActionRow
            icon={<Heart className='size-5 text-primary' />}
            title={t('card1Title')}
            desc={t('card1Desc')}
            onClick={goToFavorited}
          />
          <QuickActionRow
            icon={<CalendarClock className='size-5 text-primary' />}
            title={t('card2Title')}
            desc={t('card2Desc')}
            onClick={goToAppointments}
          />
        </div>
      </main>
    </div>
  );
}

function QuickActionRow({
  icon,
  title,
  desc,
  onClick,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'group flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md',
        className
      )}
    >
      <span className='flex size-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10'>
        {icon}
      </span>
      <span className='min-w-0 flex-1'>
        <span className='block text-sm font-semibold text-gray-900'>{title}</span>
        <span className='mt-0.5 block truncate text-xs text-gray-500'>{desc}</span>
      </span>
      <ChevronRight className='size-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-primary' />
    </button>
  );
}
