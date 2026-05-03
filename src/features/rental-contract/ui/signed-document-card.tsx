'use client';

import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, ExternalLink, FileText, Loader2, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { RentalContract, SignedDocumentStatus } from '@/entities/rental-contract';
import { Badge, Button } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

interface SignedDocumentCardProps {
  contract: RentalContract;
  showAdminError?: boolean;
  compact?: boolean;
}

const RUNNING_STATUSES: SignedDocumentStatus[] = ['PENDING', 'PROCESSING'];

export function isSignedDocumentRunning(status?: SignedDocumentStatus | null) {
  return RUNNING_STATUSES.includes(status as SignedDocumentStatus);
}

export function SignedDocumentCard({
  contract,
  showAdminError = false,
  compact = false,
}: SignedDocumentCardProps) {
  const t = useTranslations('RentalContract.signedDocument');
  const status = contract.signedDocumentStatus ?? 'NOT_REQUESTED';
  const isRunning = isSignedDocumentRunning(status);
  const isCompleted = status === 'COMPLETED';
  const isFailed = status === 'FAILED';
  const hasSignedDocument = isCompleted && Boolean(contract.signedDocumentUrl);

  const handleOpenSignedDocument = () => {
    if (!contract.signedDocumentUrl) return;
    window.open(contract.signedDocumentUrl, '_blank', 'noopener,noreferrer');
  };

  let icon: ReactNode = <FileText className='h-4 w-4' />;
  let body = t('notAvailable');
  let shellClass = 'border-primary/15 bg-gradient-to-br from-white to-primary/5';
  let iconClass = 'bg-primary/10 text-primary';
  let badgeClass = 'border-primary/20 bg-primary/10 text-primary';

  if (isRunning) {
    icon = <Loader2 className='h-4 w-4 animate-spin' />;
    body = t('preparing');
    shellClass = 'border-blue-200 bg-gradient-to-br from-white to-blue-50';
    iconClass = 'bg-blue-100 text-blue-700';
    badgeClass = 'border-blue-200 bg-blue-100 text-blue-700';
  } else if (isCompleted) {
    icon = <CheckCircle2 className='h-4 w-4' />;
    body = hasSignedDocument ? t('completed') : t('missingUrl');
    shellClass = 'border-emerald-200 bg-gradient-to-br from-white to-emerald-50';
    iconClass = 'bg-emerald-100 text-emerald-700';
    badgeClass = 'border-emerald-200 bg-emerald-100 text-emerald-700';
  } else if (isFailed) {
    icon = <AlertCircle className='h-4 w-4' />;
    body = t('failed');
    shellClass = 'border-red-200 bg-gradient-to-br from-white to-red-50';
    iconClass = 'bg-red-100 text-red-700';
    badgeClass = 'border-red-200 bg-red-100 text-red-700';
  }

  return (
    <section className={cn('overflow-hidden rounded-2xl border shadow-sm', shellClass)}>
      <div className='p-4'>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex items-start gap-3'>
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', iconClass)}>
              {icon}
            </div>
            <div className='min-w-0'>
              <div className='flex flex-wrap items-center gap-2'>
                <p className='text-sm font-semibold text-foreground'>{t('title')}</p>
                <Badge
                  variant='outline'
                  className={cn('h-6 rounded-full px-2 text-[10px] font-bold uppercase tracking-[0.14em]', badgeClass)}
                >
                  {status.replace('_', ' ')}
                </Badge>
              </div>
              <p className='mt-1 text-sm leading-6 text-muted-foreground'>{body}</p>
            </div>
          </div>
        </div>

        {showAdminError && isFailed && contract.signedDocumentError && (
          <p className='mt-3 rounded-xl border border-red-200 bg-white/80 px-3 py-2 text-xs leading-5 text-red-700'>
            {contract.signedDocumentError}
          </p>
        )}
      </div>

      {hasSignedDocument && !compact && (
        <div className='border-t border-emerald-200/70 bg-white/70 p-3'>
          <div className='overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-inner'>
            <div className='flex items-center justify-between border-b border-emerald-100 bg-emerald-50/70 px-3 py-2'>
              <div className='flex items-center gap-2 text-xs font-semibold text-emerald-800'>
                <ShieldCheck className='h-3.5 w-3.5' />
                {t('securePreview')}
              </div>
              <Button
                type='button'
                size='sm'
                variant='ghost'
                className='h-8 rounded-lg px-2 text-xs text-emerald-800 hover:bg-emerald-100'
                onClick={handleOpenSignedDocument}
              >
                <ExternalLink className='h-3.5 w-3.5' />
                {t('viewButton')}
              </Button>
            </div>
            <div className='aspect-[4/3] bg-secondary/40'>
              <iframe
                src={contract.signedDocumentUrl ?? undefined}
                title={t('iframeTitle')}
                className='h-full w-full bg-white'
              />
            </div>
          </div>
        </div>
      )}

      {hasSignedDocument && compact && (
        <div className='border-t border-emerald-200/70 bg-white/70 px-4 pb-4 pt-0'>
          <Button
            type='button'
            className='h-10 w-full rounded-xl bg-emerald-600 text-white shadow-[0_12px_24px_color-mix(in_oklch,var(--color-emerald-600,oklch(0.64_0.15_162))_18%,transparent)] hover:bg-emerald-700'
            onClick={handleOpenSignedDocument}
          >
            <ExternalLink className='h-4 w-4' />
            {t('viewButton')}
          </Button>
        </div>
      )}
    </section>
  );
}
