'use client';

import { useState, type ReactNode } from 'react';
import { Info, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatVND } from '@/shared/lib/utils/format-currency';

export interface RentVsBuyComparisonProps {
  rentPrice: number;
  salePrice: number;
}

type Recommendation = 'buy' | 'rent' | 'consider';

function getRecommendation(prYears: number): { type: Recommendation; color: string; bg: string } {
  if (prYears < 15) {
    return {
      type: 'buy',
      color: 'text-primary',
      bg: 'bg-primary/5 border-primary/20',
    };
  }
  if (prYears <= 20) {
    return {
      type: 'consider',
      color: 'text-primary',
      bg: 'bg-primary/5 border-primary/20',
    };
  }
  return {
    type: 'rent',
    color: 'text-primary',
    bg: 'bg-primary/5 border-primary/20',
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
      <h3 className="text-sm font-bold text-foreground mb-5">
        {t('title')}
      </h3>

      {/* 2-column comparison */}
      <div className="grid grid-cols-2 gap-4">
        {/* RENT column */}
        <div className="space-y-3">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {t('rent')}
          </span>

          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="text-xl font-bold text-primary leading-tight">
              {formatVND(rentPrice)}
            </span>
            <span className="text-[10px] text-muted-foreground">VNĐ / {t('perMonth')}</span>
          </div>
        </div>

        {/* BUY column */}
        <div className="space-y-3 border-l border-border pl-4">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {t('buy')}
          </span>

          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="text-xl font-bold text-primary leading-tight">
              {formatVND(salePrice)}
            </span>
            <span className="text-[10px] text-muted-foreground">VNĐ</span>
          </div>
        </div>
      </div>

      {/* Analysis */}
      {prYears > 0 && (
        <div className="mt-4 pt-3 border-t border-border">
          <div className="space-y-2">
            {/* Title row with info icon */}
            <div className="flex items-center gap-2">
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
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                - {t('equalsMonths', { months: prMonths.toLocaleString('vi-VN') })}
              </p>
              <p className="text-xs text-muted-foreground">
                - {t('equalsYears', { years: prYears.toLocaleString('vi-VN') })}
              </p>
            </div>

            {/* Recommendation */}
            <div className={`flex items-start gap-2 rounded-lg px-3 py-2 border ${rec.bg}`}>
              <p className={`text-xs font-medium leading-relaxed ${rec.color}`}>
                {t(`recommend${rec.type.charAt(0).toUpperCase() + rec.type.slice(1)}` as 'recommendBuy' | 'recommendRent' | 'recommendConsider')}
              </p>
            </div>

            {/* Formula popup */}
            {showFormula && (
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 space-y-1">
                <p className="text-[10px] font-semibold text-foreground uppercase tracking-wider">
                  {t('formulaTitle')}
                </p>
                <div className="space-y-0.5">
                  <p className="text-xs text-foreground flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                    {t('formulaGreen')}
                  </p>
                  <p className="text-xs text-foreground flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-amber-500 shrink-0" />
                    {t('formulaYellow')}
                  </p>
                  <p className="text-xs text-foreground flex items-center gap-1.5">
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

