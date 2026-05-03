'use client';

import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { RentalContract, SignedDocumentStatus } from '@/entities/rental-contract';
import { Button } from '@/shared/ui';

interface SignedDocumentCardProps {
  contract: RentalContract;
  showAdminError?: boolean;
}

const RUNNING_STATUSES: SignedDocumentStatus[] = ['PENDING', 'PROCESSING'];

export function isSignedDocumentRunning(status?: SignedDocumentStatus | null) {
  return RUNNING_STATUSES.includes(status as SignedDocumentStatus);
}

export function SignedDocumentCard({ contract, showAdminError = false }: SignedDocumentCardProps) {
  const t = useTranslations('RentalContract.signedDocument');
  const status = contract.signedDocumentStatus ?? 'NOT_REQUESTED';

  const handleOpenSignedDocument = () => {
    if (!contract.signedDocumentUrl) return;
    window.open(contract.signedDocumentUrl, '_blank', 'noopener,noreferrer');
  };

  let icon = <FileText className='h-4 w-4 text-muted-foreground' />;
  const title = t('title');
  let body = t('notAvailable');
  let tone = 'border-primary/20 bg-primary/5';
  let action: ReactNode = null;

  if (isSignedDocumentRunning(status)) {
    icon = <Loader2 className='h-4 w-4 animate-spin text-blue-600' />;
    body = t('preparing');
    tone = 'border-blue-200 bg-blue-50/70';
  } else if (status === 'COMPLETED') {
    icon = <CheckCircle2 className='h-4 w-4 text-emerald-600' />;
    body = contract.signedDocumentUrl ? t('completed') : t('missingUrl');
    tone = 'border-emerald-200 bg-emerald-50/70';
    if (contract.signedDocumentUrl) {
      action = (
        <Button
          type='button'
          size='sm'
          className='mt-3 h-9 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700'
          onClick={handleOpenSignedDocument}
        >
          <ExternalLink className='h-3.5 w-3.5' />
          {t('viewButton')}
        </Button>
      );
    }
  } else if (status === 'FAILED') {
    icon = <AlertCircle className='h-4 w-4 text-red-600' />;
    body = t('failed');
    tone = 'border-red-200 bg-red-50/70';
  }

  return (
    <div className={`rounded-xl border p-4 ${tone}`}>
      <div className='flex items-start gap-3'>
        <div className='mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/80'>
          {icon}
        </div>
        <div className='min-w-0 flex-1'>
          <p className='text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70'>
            {title}
          </p>
          <p className='mt-1 text-sm leading-6 text-muted-foreground'>{body}</p>
          {showAdminError && status === 'FAILED' && contract.signedDocumentError && (
            <p className='mt-2 rounded-lg bg-white/70 px-3 py-2 text-xs leading-5 text-red-700'>
              {contract.signedDocumentError}
            </p>
          )}
          {action}
        </div>
      </div>
    </div>
  );
}
