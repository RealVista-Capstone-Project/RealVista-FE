'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import { format, Locale, startOfDay } from 'date-fns';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/shared/ui/input-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Calendar } from '@/shared/ui/calendar';
import { Field, FieldLabel } from '@/shared/ui/field';
import { cn } from '@/shared/lib/utils';

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false;
  }
  return !isNaN(date.getTime());
}

export type DatePickerInputVariant = 'default' | 'tour';

export interface DatePickerInputProps {
  value?: string;
  onChange?: (value: string, date?: Date) => void;
  placeholder?: string;
  label?: string;
  id?: string;
  minDate?: Date;
  className?: string;
  variant?: DatePickerInputVariant;
  locale?: Locale;
}

export function DatePickerInput({
  value = '',
  onChange,
  placeholder = 'Select tour date',
  label,
  id = 'date-picker',
  minDate,
  className,
  variant = 'default',
  locale,
}: DatePickerInputProps) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(value ? new Date(value) : undefined);
  const [month, setMonth] = React.useState<Date | undefined>(value ? new Date(value) : undefined);

  // Helper to format date based on locale
  const formatDateValue = React.useCallback(
    (d: Date | undefined) => {
      if (!d) return '';
      return format(d, 'PP', { locale });
    },
    [locale]
  );

  const [inputValue, setInputValue] = React.useState(formatDateValue(date));

  React.useEffect(() => {
    if (value) {
      const newDate = new Date(value);
      if (isValidDate(newDate)) {
        setDate(newDate);
        setMonth(newDate);
        setInputValue(formatDateValue(newDate));
      }
    }
  }, [value, formatDateValue]);

  // Update input value when locale changes
  React.useEffect(() => {
    if (date) {
      setInputValue(formatDateValue(date));
    }
  }, [locale, date, formatDateValue]);

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      const formattedDate = formatDateValue(newDate);
      const isoDate = newDate.toISOString().split('T')[0];
      setDate(newDate);
      setMonth(newDate);
      setInputValue(formattedDate);
      onChange?.(isoDate, newDate);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setInputValue(inputValue);
    const parsedDate = new Date(inputValue);
    if (isValidDate(parsedDate)) {
      setDate(parsedDate);
      setMonth(parsedDate);
      onChange?.(inputValue, parsedDate);
    }
  };

  // Custom tour variant matching Figma design
  if (variant === 'tour') {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type='button'
            id={id}
            className={cn(
              'bg-white border border-purple-92 rounded-lg px-4 py-3.5',
              'flex items-center justify-between w-full',
              'hover:border-purple-92-hover transition-colors cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-main-primary/50',
              className
            )}
          >
            <div className='flex items-center gap-2 opacity-50'>
              <CalendarIcon className='size-6' />
              <span className='text-main-black text-[14px] font-medium leading-[1.4]'>
                {inputValue || placeholder}
              </span>
            </div>
            <div className='relative'>
              <svg
                width='20'
                height='20'
                viewBox='0 0 20 20'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <circle cx='10' cy='10' r='10' fill='#7065F0' fillOpacity='0.1' />
                <path d='M10 6V14M6 10H14' stroke='#7065F0' strokeWidth='2' strokeLinecap='round' />
              </svg>
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className='w-auto overflow-hidden p-0'
          align='end'
          alignOffset={-8}
          sideOffset={10}
        >
          <Calendar
            mode='single'
            selected={date}
            month={month}
            onMonthChange={setMonth}
            onSelect={(selectedDate) => {
              handleDateChange(selectedDate);
              setOpen(false);
            }}
            disabled={(date) => (minDate ? date < startOfDay(minDate) : false)}
            initialFocus
            locale={locale}
          />
        </PopoverContent>
      </Popover>
    );
  }

  // Default variant with input field
  const content = (
    <InputGroup className={className}>
      <InputGroupInput
        id={id}
        value={inputValue}
        placeholder={placeholder}
        onChange={handleInputChange}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
          }
        }}
      />
      <InputGroupAddon align='inline-end'>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <InputGroupButton
              id={`${id}-button`}
              variant='ghost'
              size='icon-xs'
              aria-label='Select date'
            >
              <CalendarIcon />
              <span className='sr-only'>Select date</span>
            </InputGroupButton>
          </PopoverTrigger>
          <PopoverContent
            className='w-auto overflow-hidden p-0'
            align='end'
            alignOffset={-8}
            sideOffset={10}
          >
            <Calendar
              mode='single'
              selected={date}
              month={month}
              onMonthChange={setMonth}
              onSelect={handleDateChange}
              disabled={(date) => (minDate ? date < startOfDay(minDate) : false)}
              initialFocus
              locale={locale}
            />
          </PopoverContent>
        </Popover>
      </InputGroupAddon>
    </InputGroup>
  );

  if (label) {
    return (
      <Field className={className}>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {content}
      </Field>
    );
  }

  return content;
}
