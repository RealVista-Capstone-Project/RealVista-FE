import type { ReactNode } from 'react';
import { Building2 } from 'lucide-react';
import { Input, Label } from '@/shared/ui';
import { cn, formatVND } from '@/shared/lib/utils';

// ── Field wrapper ─────────────────────────────────────────────────────────────

export function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <Label className='mb-2 block text-sm font-medium text-foreground'>{label}</Label>
      {children}
    </div>
  );
}

// ── Money input ───────────────────────────────────────────────────────────────

function formatNumberDisplay(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('vi-VN');
}

function sanitizeNumericInput(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function MoneyInput({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (raw: string) => void;
  className?: string;
}) {
  return (
    <div className='relative'>
      <Input
        inputMode='numeric'
        value={formatNumberDisplay(value)}
        onChange={(event) => onChange(sanitizeNumericInput(event.target.value))}
        className={cn('pr-14', className)}
      />
      <span className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none text-xs font-semibold text-secondary/60'>
        VND
      </span>
    </div>
  );
}

// ── Listing meta chip ─────────────────────────────────────────────────────────

export function ListingMetaChip({
  icon: Icon,
  value,
}: {
  icon: typeof Building2;
  value: string;
}) {
  return (
    <div className='inline-flex items-center gap-2 rounded-full bg-primary/5 px-3 py-1.5 text-xs font-semibold text-secondary/80'>
      <Icon className='h-3.5 w-3.5 text-primary' />
      <span>{value}</span>
    </div>
  );
}

// ── Currency formatter ────────────────────────────────────────────────────────

export function formatCurrencyValue(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return value || '0';
  return formatVND(amount);
}
