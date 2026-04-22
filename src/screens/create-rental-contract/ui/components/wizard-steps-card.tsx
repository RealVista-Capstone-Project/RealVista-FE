import { Fragment } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

type WizardStep = 1 | 2 | 3 | 4;

interface Step {
  id: WizardStep;
  label: string;
  description: string;
}

interface WizardStepsCardProps {
  steps: Step[];
  currentStep: WizardStep;
  maxAllowedStep?: WizardStep;
  onStepClick: (step: WizardStep) => void;
}

export function WizardStepsCard({
  steps,
  currentStep,
  maxAllowedStep,
  onStepClick,
}: WizardStepsCardProps) {
  return (
    <div className='flex items-center gap-3'>
      {steps.map((step, index) => {
        const isActive = currentStep === step.id;
        const isComplete = currentStep > step.id;
        const isLocked = maxAllowedStep !== undefined && step.id > maxAllowedStep;

        return (
          <Fragment key={step.id}>
            <button
              type='button'
              onClick={() => !isLocked && onStepClick(step.id)}
              disabled={isLocked}
              title={isLocked ? 'Complete the current step to unlock' : undefined}
              className={cn(
                'flex items-center gap-2 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-lg',
                isLocked ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
              )}
            >
              {/* Circle badge */}
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  isActive && 'bg-primary text-white',
                  isComplete && 'bg-primary text-white',
                  !isActive && !isComplete && 'bg-muted text-muted-foreground',
                )}
              >
                {isComplete ? <Check className='h-3.5 w-3.5' strokeWidth={3} /> : step.id}
              </div>

              {/* Label */}
              <span
                className={cn(
                  'hidden text-sm font-medium sm:block',
                  isActive && 'font-semibold text-foreground',
                  isComplete && 'text-foreground',
                  !isActive && !isComplete && 'text-muted-foreground',
                )}
              >
                {step.label}
              </span>
            </button>

            {index < steps.length - 1 && (
              <ChevronRight className='h-4 w-4 shrink-0 text-muted-foreground/40' />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
