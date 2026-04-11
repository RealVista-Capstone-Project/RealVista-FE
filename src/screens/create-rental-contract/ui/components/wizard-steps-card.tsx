import { Check } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui';
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
  eyebrow: string;
  title: string;
  subtitle: string;
  progressLabel: string;
  onStepClick: (step: WizardStep) => void;
}

export function WizardStepsCard({
  steps,
  currentStep,
  eyebrow,
  title,
  subtitle,
  progressLabel,
  onStepClick,
}: WizardStepsCardProps) {
  return (
    <Card className='overflow-hidden rounded-[28px] border-[#EBE2FF] bg-white/92 shadow-[0_20px_48px_rgba(92,63,214,0.08)]'>
      <CardContent className='p-5'>
        <div className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.22em] text-main-secondary/50'>
              {eyebrow}
            </p>
            <h2 className='mt-2 text-2xl font-semibold tracking-[-0.03em] text-main-black'>
              {title}
            </h2>
            <p className='mt-2 max-w-2xl text-sm leading-6 text-main-secondary/65'>{subtitle}</p>
          </div>
          <div className='rounded-full border border-[#E7DDFF] bg-[#FAF8FF] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-main-primary/75'>
            {progressLabel}
          </div>
        </div>

        <div className='mt-5 grid gap-3 md:grid-cols-4'>
          {steps.map((step) => {
            const isActive = currentStep === step.id;
            const isComplete = currentStep > step.id;

            return (
              <button
                key={step.id}
                type='button'
                className={cn(
                  'flex min-w-0 items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-all',
                  isActive
                    ? 'border-main-primary bg-[#F3EEFF] shadow-[0_12px_28px_rgba(92,63,214,0.12)]'
                    : 'border-[#EEE6FF] bg-[#FCFBFF] hover:border-[#D8C8FF] hover:bg-[#F8F4FF]'
                )}
                onClick={() => onStepClick(step.id)}
              >
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold',
                    isComplete
                      ? 'bg-main-primary text-white'
                      : isActive
                        ? 'bg-white text-main-primary shadow-sm'
                        : 'bg-[#F1ECFF] text-main-secondary/60'
                  )}
                >
                  {isComplete ? <Check className='h-4 w-4' /> : step.id}
                </div>
                <div className='min-w-0'>
                  <p className='text-sm font-semibold text-main-black'>{step.label}</p>
                  <p className='mt-1 line-clamp-2 text-xs leading-5 text-main-secondary/60'>
                    {step.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
