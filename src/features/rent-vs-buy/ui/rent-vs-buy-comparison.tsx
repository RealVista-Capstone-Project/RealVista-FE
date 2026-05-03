'use client';

import { useState, type ReactNode } from 'react';
import { TrendingUp, Home, Key, Info, X, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatVND } from '@/shared/lib/utils/format-currency';

export interface RentVsBuyComparisonProps {
  rentPrice: number;
  salePrice: number;
}

type Recommendation = 'buy' | 'rent' | 'consider';

function getRecommendation(prYears: number): { type: Recommendation; color: string; icon: ReactNode; bg: string } {
  if (prYears < 15) {
    return {
      type: 'buy',
      color: 'text-emerald-600',
      icon: <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />,
      bg: 'bg-emerald-50 border-emerald-200',
    };
  }
  if (prYears <= 20) {
    return {
      type: 'consider',
      color: 'text-amber-600',
      icon: <AlertTriangle className="size-4 text-amber-500 shrink-0" />,
      bg: 'bg-amber-50 border-amber-200',
    };
  }
  return {
    type: 'rent',
    color: 'text-rose-600',
    icon: <HelpCircle className="size-4 text-rose-500 shrink-0" />,
    bg: 'bg-rose-50 border-rose-200',
  };
}

export function RentVsBuyComparison({
  rentPrice,
  salePrice,
}: RentVsBuyComparisonProps) {
  const t = useTranslations('RentVsBuy');
  const [showFormula, setShowFormula] = useState(false);

  const prMonths = rentPrice > 0 ? Math.round(salePrice / rentPrice) : 0;
  const prYears = rentPrice > 0 ? Math.round(salePrice / rentPrice / 12) : 0;
  const rec = getRecommendation(prYears);

  return (
    <div className="bg-white border border-primary/10 rounded-xl p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
        <TrendingUp className="size-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          {t('title')}
        </h3>
      </div>

      {/* 2-column comparison */}
      <div className="grid grid-cols-2 gap-4">
        {/* RENT column */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <Key className="size-3.5 text-muted-foreground" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {t('rent')}
            </span>
          </div>

          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="text-xl font-bold text-primary leading-tight">
              {formatVND(rentPrice)}
            </span>
            <span className="text-[10px] text-muted-foreground">VNĐ / {t('perMonth')}</span>
          </div>
        </div>

        {/* BUY column */}
        <div className="space-y-3 border-l border-border pl-4">
          <div className="flex items-center gap-1.5">
            <Home className="size-3.5 text-muted-foreground" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {t('buy')}
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="text-xl font-bold text-primary leading-tight">
                {formatVND(salePrice)}
              </span>
              <span className="text-[10px] text-muted-foreground">VNĐ</span>
            </div>
            <span className="text-xs text-muted-foreground">{t('fullPrice')}</span>
          </div>
        </div>
      </div>

      {/* Analysis */}
      {prYears > 0 && (
        <div className="mt-4 pt-3 border-t border-border">
          <div className="space-y-2">
            {/* Title row with info icon */}
            <div className="flex items-center gap-2">
              <CalculatorIcon className="size-4 text-primary shrink-0" />
              <span className="text-xs font-semibold text-foreground">
                {t('analysisTitle', { price: formatVND(salePrice) })}
              </span>
              <button
                type="button"
                onClick={() => setShowFormula(!showFormula)}
                className="ml-auto p-0.5 rounded-full hover:bg-muted transition-colors"
                title={t('formulaTitle')}
              >
                {showFormula ? (
                  <X className="size-3.5 text-muted-foreground" />
                ) : (
                  <Info className="size-3.5 text-muted-foreground" />
                )}
              </button>
            </div>

            {/* Bullet points */}
            <div className="pl-6 space-y-1">
              <p className="text-xs text-muted-foreground">
                - {t('equalsMonths', { months: prMonths.toLocaleString('vi-VN') })}
              </p>
              <p className="text-xs text-muted-foreground">
                - {t('equalsYears', { years: prYears.toLocaleString('vi-VN') })}
              </p>
            </div>

            {/* Recommendation */}
            <div className={`flex items-start gap-2 rounded-lg px-3 py-2 border ${rec.bg}`}>
              {rec.icon}
              <p className={`text-xs font-medium leading-relaxed ${rec.color}`}>
                {t(`recommend${rec.type.charAt(0).toUpperCase() + rec.type.slice(1)}` as 'recommendBuy' | 'recommendRent' | 'recommendConsider')}
              </p>
            </div>

            {/* Formula popup */}
            {showFormula && (
              <div className="rounded-lg border border-primary/10 bg-gradient-to-r from-primary/5 to-primary/10 px-3 py-2.5 space-y-1">
                <p className="text-[10px] font-semibold text-foreground uppercase tracking-wider">
                  {t('formulaTitle')}
                </p>
                <div className="space-y-0.5">
                  <p className="text-xs text-emerald-600 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                    {t('formulaGreen')}
                  </p>
                  <p className="text-xs text-amber-600 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-amber-500 shrink-0" />
                    {t('formulaYellow')}
                  </p>
                  <p className="text-xs text-rose-600 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-rose-500 shrink-0" />
                    {t('formulaRed')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CalculatorIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="16" height="20" x="4" y="2" rx="2" />
      <line x1="8" x2="16" y1="6" y2="6" />
      <line x1="16" x2="16" y1="14" y2="14" />
      <path d="M8 14h.01" />
      <path d="M8 18h.01" />
      <path d="M12 18h.01" />
      <path d="M12 14h.01" />
    </svg>
  );
}
