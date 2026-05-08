'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/shared/ui/sheet/sheet';
import { Label } from '@/shared/ui/label/label';
import { VndAmountInput } from '@/shared/ui/vnd-amount-input/vnd-amount-input';
import { formatVND } from '@/shared/lib/utils/format-currency';

interface MortgageCalculatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Listing price in VND */
  listingPrice: number;
}

export function MortgageCalculator({ open, onOpenChange, listingPrice }: MortgageCalculatorProps) {
  const [propertyPrice, setPropertyPrice] = useState(listingPrice);
  const [downPaymentPercent, setDownPaymentPercent] = useState(30);
  const [interestRate, setInterestRate] = useState(8.5);
  const [loanTerm, setLoanTerm] = useState(20);

  useEffect(() => {
    setPropertyPrice(listingPrice);
  }, [listingPrice]);

  const downPaymentAmount = useMemo(() => {
    return Math.round(propertyPrice * (downPaymentPercent / 100));
  }, [propertyPrice, downPaymentPercent]);

  const loanAmount = useMemo(() => {
    return Math.max(0, propertyPrice - downPaymentAmount);
  }, [propertyPrice, downPaymentAmount]);

  const monthlyPayment = useMemo(() => {
    if (loanAmount <= 0) return 0;
    const monthlyRate = interestRate / 100 / 12;
    const totalMonths = loanTerm * 12;
    if (monthlyRate === 0) return loanAmount / totalMonths;
    return Math.round(
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1)
    );
  }, [loanAmount, interestRate, loanTerm]);

  const totalInterest = useMemo(() => {
    return Math.max(0, monthlyPayment * loanTerm * 12 - loanAmount);
  }, [monthlyPayment, loanTerm, loanAmount]);

  const totalCost = useMemo(() => {
    return downPaymentAmount + monthlyPayment * loanTerm * 12;
  }, [downPaymentAmount, monthlyPayment, loanTerm]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-full sm:max-w-md flex flex-col h-full overflow-hidden'>
        <SheetHeader className='px-6 py-4 border-b shrink-0'>
          <SheetTitle className='text-lg font-bold tracking-tight text-foreground'>
            Tính toán khoản vay
          </SheetTitle>
          <SheetDescription className='text-xs'>
            Ước tính chi phí hàng tháng cho khoản vay mua nhà của bạn
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 min-h-0 overflow-hidden px-6 py-4 space-y-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]'>
          {/* Listing Price - Editable */}
          <div className='space-y-1.5'>
            <Label className='text-xs font-semibold text-muted-foreground'>
              Giá bất động sản
            </Label>
            <VndAmountInput
              value={propertyPrice}
              onChange={setPropertyPrice}
              hidePreview={true}
              inputClassName='text-right font-semibold'
            />
          </div>

          {/* Down Payment */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Label className='text-xs font-semibold text-muted-foreground'>
                Trả trước
              </Label>
              <span className='text-sm font-bold text-foreground'>
                {formatVND(downPaymentAmount)} ({downPaymentPercent}%)
              </span>
            </div>
            <SliderTrack
              min={10}
              max={90}
              value={downPaymentPercent}
              onChange={setDownPaymentPercent}
            />
          </div>

          {/* Interest Rate */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Label className='text-xs font-semibold text-muted-foreground'>
                Lãi suất / năm
              </Label>
              <span className='text-sm font-bold text-foreground'>
                {interestRate}%
              </span>
            </div>
            <SliderTrack
              min={1}
              max={20}
              step={0.1}
              value={interestRate}
              onChange={setInterestRate}
            />
          </div>

          {/* Loan Term */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Label className='text-xs font-semibold text-muted-foreground'>
                Thời hạn vay
              </Label>
              <span className='text-sm font-bold text-foreground'>
                {loanTerm} năm
              </span>
            </div>
            <SliderTrack
              min={5}
              max={30}
              value={loanTerm}
              onChange={setLoanTerm}
            />
          </div>

          {/* Results */}
          <div className='bg-muted/50 rounded-xl p-3 space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='text-xs text-muted-foreground'>Số tiền vay</span>
              <span className='text-sm font-bold text-foreground'>
                {formatVND(loanAmount)}
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-xs text-muted-foreground'>Tổng lãi phải trả</span>
              <span className='text-sm font-bold text-foreground'>
                {formatVND(totalInterest)}
              </span>
            </div>
            <div className='border-t border-border pt-2'>
              <div className='flex items-center justify-between'>
                <span className='text-xs text-muted-foreground'>Tổng chi phí</span>
                <span className='text-sm font-bold text-primary'>
                  {formatVND(totalCost)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className='px-6 py-4 border-t bg-white shrink-0'>
          <div className='w-full space-y-1'>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-muted-foreground'>Trả hàng tháng</span>
              <span className='text-xl font-bold text-primary'>
                {formatVND(monthlyPayment)}
              </span>
            </div>
            <p className='text-[11px] text-muted-foreground leading-snug'>
              Đây là ước tính. Chi phí thực tế có thể khác tùy theo ngân hàng và điều kiện vay.
            </p>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function SliderTrack({
  min,
  max,
  step = 1,
  value,
  onChange,
}: {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (val: number) => void;
}) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className='relative h-2 w-full'>
      {/* Background track */}
      <div className='absolute inset-0 rounded-full bg-primary/20' />
      {/* Filled portion */}
      <div
        className='absolute left-0 top-0 h-full rounded-full bg-primary'
        style={{ width: `${percent}%` }}
      />
      {/* Circular thumb */}
      <div
        className='absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-primary shadow-sm pointer-events-none'
        style={{ left: `calc(${percent}% - 8px)` }}
      />
      {/* Invisible input for interaction */}
      <input
        type='range'
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
      />
    </div>
  );
}
