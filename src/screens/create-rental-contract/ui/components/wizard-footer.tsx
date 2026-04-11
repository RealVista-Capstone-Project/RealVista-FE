import { ArrowLeft, ArrowRight, Loader2, Save, SendHorizontal } from 'lucide-react';
import { Button } from '@/shared/ui';

type WizardStep = 1 | 2 | 3 | 4;

interface WizardFooterProps {
  currentStep: WizardStep;
  totalSteps: number;
  isStepValid: boolean;
  isMutating: boolean;
  onBack: () => void;
  onNext: () => void;
  onSaveDraft: () => void;
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
  onSaveDraft,
  onSendForSigning,
  t,
}: WizardFooterProps) {
  return (
    <div className='mt-8 flex flex-col gap-3 border-t border-[#F0E8FF] pt-6 sm:flex-row sm:items-center sm:justify-between'>
      {/* Left: Save draft + Back */}
      <div className='flex flex-wrap gap-3'>
        <Button
          type='button'
          variant='outline'
          className='h-11 rounded-xl border-[#DED1FF] bg-white px-4 hover:bg-[#F8F4FF]'
          onClick={onSaveDraft}
          disabled={isMutating}
        >
          <Save className='h-4 w-4' />
          {t('actions.saveDraft')}
        </Button>

        {currentStep > 1 && (
          <Button
            type='button'
            variant='ghost'
            className='h-11 rounded-xl px-4 text-main-secondary/70 hover:bg-[#F8F4FF] hover:text-main-black'
            onClick={onBack}
          >
            <ArrowLeft className='h-4 w-4' />
            {t('actions.back')}
          </Button>
        )}
      </div>

      {/* Right: Next or Send */}
      <div className='flex flex-wrap gap-3'>
        {currentStep < totalSteps ? (
          <Button
            type='button'
            className='h-11 rounded-xl bg-main-primary px-5 text-white shadow-[0_18px_30px_rgba(92,63,214,0.24)] hover:bg-main-primary-hover'
            onClick={onNext}
            disabled={!isStepValid || isMutating}
          >
            {t('actions.next')}
            <ArrowRight className='h-4 w-4' />
          </Button>
        ) : (
          <Button
            type='button'
            className='h-11 rounded-xl bg-main-primary px-5 text-white shadow-[0_18px_30px_rgba(92,63,214,0.24)] hover:bg-main-primary-hover'
            onClick={onSendForSigning}
            disabled={isMutating}
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
          </Button>
        )}
      </div>
    </div>
  );
}
