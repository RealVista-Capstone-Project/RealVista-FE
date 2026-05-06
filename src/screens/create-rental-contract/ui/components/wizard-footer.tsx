import { ArrowLeft, Loader2, SendHorizontal } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

type WizardStep = 1 | 2 | 3 | 4;

interface WizardFooterProps {
  currentStep: WizardStep;
  totalSteps: number;
  isStepValid: boolean;
  isMutating: boolean;
  onBack: () => void;
  onNext: () => void;
  onSendForSigning: () => void;
  t: (key: string) => string;
}

export function WizardFooter({
  currentStep,
  totalSteps,
  isStepValid,
  isMutating,
  onBack,
  onNext,
  onSendForSigning,
  t,
}: WizardFooterProps) {
  const isLastStep = currentStep >= totalSteps;
  const canProceed = isLastStep ? !isMutating : isStepValid && !isMutating;

  return (
    <div className='shrink-0 flex items-center justify-between border-t border-primary/20 bg-white px-4 md:px-8 py-4 md:py-5'>
      {/* Left: Back */}
      <div className='flex items-center gap-2'>
        {currentStep > 1 && (
          <button
            type='button'
            onClick={onBack}
            className='flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-primary/5 hover:text-foreground'
          >
            <ArrowLeft className='h-4 w-4' />
            {t('actions.back')}
          </button>
        )}
      </div>

      {/* Right: Save Draft + Next/Send */}
      <div className='flex items-center gap-2'>
        {isLastStep ? (
          <button
            type='button'
            onClick={onSendForSigning}
            disabled={isMutating}
            className={cn(
              'flex sm:min-w-[160px] items-center justify-center gap-2 rounded-lg px-8 py-3 text-base font-bold text-white transition-all',
              !isMutating
                ? 'bg-primary hover:bg-primary/90 shadow-[0px_4px_16px_0px_color-mix(in_oklch,var(--primary)_30%,transparent)]'
                : 'cursor-not-allowed bg-primary/30',
            )}
          >
            {isMutating ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin' />
                {t('actions.sending')}
              </>
            ) : (
              <>
                <SendHorizontal className='h-4 w-4' />
                {t('actions.sendForSigning')}
              </>
            )}
          </button>
        ) : (
          <button
            type='button'
            onClick={onNext}
            disabled={!canProceed}
            className={cn(
              'flex sm:min-w-[160px] items-center justify-center rounded-lg px-8 py-3 text-base font-bold text-white transition-all',
              canProceed
                ? 'bg-primary hover:bg-primary/90 shadow-[0px_4px_16px_0px_color-mix(in_oklch,var(--primary)_30%,transparent)]'
                : 'cursor-not-allowed bg-primary/30',
            )}
          >
            {t('actions.next')}
          </button>
        )}
      </div>
    </div>
  );
}
