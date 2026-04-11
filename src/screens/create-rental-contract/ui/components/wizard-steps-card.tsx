import { Check } from 'lucide-react';
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
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  progressLabel?: string;
  onStepClick: (step: WizardStep) => void;
}

const ARROW = 20; // px — depth of the chevron arrow tip

function getClipPath(isFirst: boolean, isLast: boolean) {
  if (isFirst) {
    return `polygon(0 0, calc(100% - ${ARROW}px) 0, 100% 50%, calc(100% - ${ARROW}px) 100%, 0 100%)`;
  }
  if (isLast) {
    return `polygon(${ARROW}px 0, 100% 0, 100% 100%, 0 100%, ${ARROW}px 50%)`;
  }
  return `polygon(${ARROW}px 0, calc(100% - ${ARROW}px) 0, 100% 50%, calc(100% - ${ARROW}px) 100%, 0 100%, ${ARROW}px 50%)`;
}

export function WizardStepsCard({
  steps,
  currentStep,
  onStepClick,
}: WizardStepsCardProps) {
  return (
    /* Outer wrapper → clips everything to rounded corners */
    <div className='overflow-hidden rounded-2xl border border-[#E0D5FF] shadow-[0_8px_30px_rgba(92,63,214,0.10)]'>
      {/* Step bar — flex row, NO overflow-hidden so arrow tips can overlap siblings */}
      <div className='relative flex h-16 w-full bg-[#F2EEFF]'>
        {steps.map((step, index) => {
          const isFirst = index === 0;
          const isLast = index === steps.length - 1;
          const isActive = currentStep === step.id;
          const isComplete = currentStep > step.id;

          // Descending z-index: left steps sit ON TOP of right steps
          // so the purple tip of the active step covers the next step's left notch
          const zIndex = steps.length - index;

          const bg = isActive
            ? 'bg-main-primary'
            : isComplete
              ? 'bg-[#D8CCFF]'
              : 'bg-[#F2EEFF]';

          const hoverBg = isActive
            ? 'hover:bg-main-primary-hover'
            : isComplete
              ? 'hover:bg-[#CABEFF]'
              : 'hover:bg-[#E8E0FF]';

          // Extra horizontal padding to compensate for arrow overlap
          const pl = isFirst ? 20 : ARROW + 14;
          const pr = isLast ? 20 : ARROW + 8;

          return (
            <button
              key={step.id}
              type='button'
              onClick={() => onStepClick(step.id)}
              className={cn(
                'flex h-full items-center gap-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-main-primary/40',
                bg,
                hoverBg,
              )}
              style={{
                flex: 1,
                marginLeft: isFirst ? 0 : -ARROW,
                paddingLeft: pl,
                paddingRight: pr,
                zIndex,
                clipPath: getClipPath(isFirst, isLast),
              }}
            >
              {/* Step number / check badge */}
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  isActive && 'bg-white/20 text-white ring-1 ring-white/30',
                  isComplete && 'bg-main-primary text-white',
                  !isActive && !isComplete && 'bg-white/70 text-main-secondary/50 shadow-sm',
                )}
              >
                {isComplete ? <Check className='h-3.5 w-3.5' strokeWidth={3} /> : step.id}
              </span>

              {/* Label + subtitle */}
              <div className='min-w-0'>
                <p
                  className={cn(
                    'truncate text-[11px] font-extrabold uppercase tracking-widest leading-none',
                    isActive && 'text-white',
                    isComplete && 'text-main-primary',
                    !isActive && !isComplete && 'text-main-secondary/50',
                  )}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p
                    className={cn(
                      'mt-1 line-clamp-1 text-[10px] leading-none',
                      isActive && 'text-white/65',
                      isComplete && 'text-main-primary/55',
                      !isActive && !isComplete && 'text-main-secondary/38',
                    )}
                  >
                    {step.description}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
