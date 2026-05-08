import * as React from 'react';
import { Calendar as CalendarIcon, LayoutGrid, List, Plus } from 'lucide-react';
import {
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Calendar } from '@/shared/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';

type TranslationFn = ReturnType<typeof useTranslations>;
export type ViewMode = 'kanban' | 'table';

const DATE_PRESETS = [
  { key: 'today', getRange: () => ({ from: startOfDay(new Date()), to: startOfDay(new Date()) }) },
  {
    key: 'yesterday',
    getRange: () => {
      const date = subDays(startOfDay(new Date()), 1);
      return { from: date, to: date };
    },
  },
  {
    key: 'thisWeek',
    getRange: () => ({
      from: startOfWeek(new Date(), { weekStartsOn: 1 }),
      to: startOfDay(new Date()),
    }),
  },
  {
    key: 'last7Days',
    getRange: () => ({ from: subDays(startOfDay(new Date()), 6), to: startOfDay(new Date()) }),
  },
  {
    key: 'last28Days',
    getRange: () => ({ from: subDays(startOfDay(new Date()), 27), to: startOfDay(new Date()) }),
  },
  {
    key: 'thisMonth',
    getRange: () => ({ from: startOfMonth(new Date()), to: startOfDay(new Date()) }),
  },
  {
    key: 'lastMonth',
    getRange: () => {
      const lastMonth = subMonths(new Date(), 1);
      return { from: startOfMonth(lastMonth), to: subDays(startOfMonth(new Date()), 1) };
    },
  },
  {
    key: 'thisYear',
    getRange: () => ({ from: startOfYear(new Date()), to: startOfDay(new Date()) }),
  },
] as const;

export function getInitialDateRange(): DateRange {
  return DATE_PRESETS.find((preset) => preset.key === 'last28Days')!.getRange();
}

function formatDisplayRange(range: DateRange, fallback: string) {
  if (!range.from || !range.to) return fallback;
  return `${format(range.from, 'dd/MM/yyyy')} - ${format(range.to, 'dd/MM/yyyy')}`;
}

function isSameRange(left: DateRange, right: DateRange) {
  return (
    !!left.from &&
    !!left.to &&
    !!right.from &&
    !!right.to &&
    left.from.getTime() === right.from.getTime() &&
    left.to.getTime() === right.to.getTime()
  );
}

export const DateRangePicker = React.memo(function DateRangePicker({
  value,
  onChange,
  t,
}: {
  value: DateRange;
  onChange: (value: DateRange) => void;
  t: TranslationFn;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className='h-9 shrink-0 justify-start gap-2 rounded-lg border-border/80 bg-white px-3 shadow-sm dark:bg-background'
        >
          <CalendarIcon className='size-4 text-muted-foreground' />
          {formatDisplayRange(value, t('dateRange.select'))}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align='end'
        className='w-auto flex-row gap-0 overflow-hidden rounded-2xl border-primary/10 bg-card p-0 shadow-xl shadow-primary/10'
      >
        <div className='flex min-w-36 flex-col border-r border-primary/10 bg-primary/[0.04] p-2'>
          {DATE_PRESETS.map((preset) => (
            <Button
              key={preset.key}
              variant='ghost'
              className={cn(
                'justify-start rounded-lg text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary',
                isSameRange(value, preset.getRange()) &&
                  'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
              )}
              onClick={() => {
                onChange(preset.getRange());
                setOpen(false);
              }}
            >
              {t(`dateRange.presets.${preset.key}`)}
            </Button>
          ))}
        </div>
        <Calendar
          mode='range'
          selected={value}
          locale={vi}
          onSelect={(range) => {
            if (range?.from && range?.to) {
              onChange(range);
            } else if (range?.from) {
              onChange(range);
            }
          }}
          numberOfMonths={1}
          className='p-4'
          classNames={{
            today:
              'rounded-(--cell-radius) bg-primary/10 text-primary data-[selected=true]:rounded-none',
            range_start:
              'relative isolate rounded-none bg-transparent after:absolute after:inset-y-0 after:right-0 after:w-1/2 after:bg-primary/10',
            range_middle: 'rounded-none bg-primary/10 text-foreground',
            range_end:
              'relative isolate rounded-none bg-transparent after:absolute after:inset-y-0 after:left-0 after:w-1/2 after:bg-primary/10',
            day_button:
              'data-[range-middle=true]:!bg-transparent data-[range-middle=true]:text-foreground data-[range-middle=true]:hover:!bg-transparent',
          }}
        />
      </PopoverContent>
    </Popover>
  );
});

export function CrmViewModeToggle({
  view,
  onViewChange,
}: {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
}) {
  return (
    <div className='flex shrink-0 items-center gap-0.5 rounded-lg border border-border/80 bg-white p-0.5 shadow-sm dark:bg-background'>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className={cn(
                'size-8 rounded-md',
                view === 'kanban' && 'bg-primary/10 text-primary'
              )}
              onClick={() => onViewChange('kanban')}
            >
              <LayoutGrid className='size-4' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Kanban</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className={cn('size-8 rounded-md', view === 'table' && 'bg-primary/10 text-primary')}
              onClick={() => onViewChange('table')}
            >
              <List className='size-4' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bảng</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

interface CrmHeaderProps {
  onAddLead: () => void;
}

export function CrmHeader({ onAddLead }: CrmHeaderProps) {
  return (
    <div className='flex justify-end'>
      <Button className='gap-1.5 rounded-lg' onClick={onAddLead}>
        <Plus className='size-4' data-icon='inline-start' />
        Thêm khách hàng
      </Button>
    </div>
  );
}
