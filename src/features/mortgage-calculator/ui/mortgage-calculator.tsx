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
import { Input } from '@/shared/ui/input/input';
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
      <SheetContent side='right' className='w-full sm:max-w-md flex flex-col'>
        <SheetHeader className='px-6 py-6 border-b'>
          <SheetTitle className='text-xl font-bold tracking-tight text-foreground'>
            Tính toán khoản vay
          </SheetTitle>
          <SheetDescription>
            Ước tính chi phí hàng tháng cho khoản vay mua nhà của bạn
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-y-auto px-6 py-6 space-y-6'>
          {/* Listing Price - Editable */}
          <div className='space-y-2'>
            <Label className='text-sm font-semibold text-muted-foreground'>
              Giá bất động sản
            </Label>
            <div className='text-2xl font-bold text-primary'>
              {formatVND(propertyPrice)}
            </div>
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
              <Label className='text-sm font-semibold text-muted-foreground'>
                Trả trước
              </Label>
              <span className='text-sm font-bold text-foreground'>
                {formatVND(downPaymentAmount)}
              </span>
            </div>
            <div className='flex items-center gap-3'>
              <Input
                type='range'
                min={10}
                max={90}
                value={downPaymentPercent}
                onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                className='flex-1 h-2 accent-primary'
              />
              <span className='text-sm font-semibold w-12 text-right'>
                {downPaymentPercent}%
              </span>
            </div>
          </div>

          {/* Interest Rate */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Label className='text-sm font-semibold text-muted-foreground'>
                Lãi suất / năm
              </Label>
              <span className='text-sm font-bold text-foreground'>
                {interestRate}%
              </span>
            </div>
            <div className='flex items-center gap-3'>
              <Input
                type='range'
                min={1}
                max={20}
                step={0.1}
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className='flex-1 h-2 accent-primary'
              />
            </div>
          </div>

          {/* Loan Term */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Label className='text-sm font-semibold text-muted-foreground'>
                Thổi hạn vay
              </Label>
              <span className='text-sm font-bold text-foreground'>
                {loanTerm} năm
              </span>
            </div>
            <div className='flex items-center gap-3'>
              <Input
                type='range'
                min={5}
                max={30}
                value={loanTerm}
                onChange={(e) => setLoanTerm(Number(e.target.value))}
                className='flex-1 h-2 accent-primary'
              />
            </div>
          </div>

          {/* Results */}
          <div className='bg-muted/50 rounded-xl p-4 space-y-3'>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-muted-foreground'>Số tiền vay</span>
              <span className='text-sm font-bold text-foreground'>
                {formatVND(loanAmount)}
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-muted-foreground'>Tổng lãi phải trả</span>
              <span className='text-sm font-bold text-foreground'>
                {formatVND(totalInterest)}
              </span>
            </div>
            <div className='border-t border-border pt-3'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-muted-foreground'>Tổng chi phí</span>
                <span className='text-sm font-bold text-primary'>
                  {formatVND(totalCost)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className='p-6 border-t bg-white'>
          <div className='w-full space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-muted-foreground'>Trả hàng tháng</span>
              <span className='text-2xl font-bold text-primary'>
                {formatVND(monthlyPayment)}
              </span>
            </div>
            <p className='text-xs text-muted-foreground'>
              Đây là ước tính. Chi phí thực tế có thể khác tùy theo ngân hàng và điều kiện vay.
            </p>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
