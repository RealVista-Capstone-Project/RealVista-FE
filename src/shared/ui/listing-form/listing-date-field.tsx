'use client';

import * as React from 'react';
import { vi } from 'date-fns/locale';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Calendar } from '@/shared/ui/calendar';
import { cn } from '@/shared/lib/utils';

interface ListingDateFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  error?: string;
}

/**
 * Date picker field styled to match the other listing form inputs.
 * Used for the "Available From" date in listing forms.
 */
export function ListingDateField({ value, onChange, label, error }: ListingDateFieldProps) {
  const [open, setOpen] = React.useState(false);

  const date = React.useMemo(() => {
    if (!value) return undefined;
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }, [value]);
  const displayValue = date ? format(date, 'PP', { locale: vi }) : '';

  const handleSelect = (selected: Date | undefined) => {
    if (selected) {
      onChange(
          `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, '0')}-${String(selected.getDate()).padStart(2, '0')}`
        );
      setOpen(false);
    }
  };

  return (
    <div className='flex flex-col gap-2'>
      <label className='text-sm font-medium text-foreground'>{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type='button'
            className={cn(
              'flex w-full items-center justify-between rounded-lg border bg-background px-4 py-3 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
              error
                ? 'border-red-400 focus:border-red-500'
                : 'border-primary/20 focus:border-primary',
              !displayValue && 'text-muted-foreground/70'
            )}
          >
            <span>{displayValue || 'dd/mm/yyyy'}</span>
            <CalendarIcon className='size-4 text-muted-foreground/70' />
          </button>
        </PopoverTrigger>
        <PopoverContent className='w-auto overflow-hidden p-0' align='start' sideOffset={8}>
          <Calendar
            mode='single'
            selected={date}
            onSelect={handleSelect}
            initialFocus
            locale={vi}
          />
        </PopoverContent>
      </Popover>
      {error && <span className='text-xs text-red-500'>{error}</span>}
    </div>
  );
}
