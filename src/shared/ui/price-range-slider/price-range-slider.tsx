'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatVND } from '@/shared/lib/utils/format-currency';

export interface PriceRangeSliderProps {
  minValue: number;
  maxValue: number;
  currentMin: number;
  currentMax: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
  histogramData: number[];
  title?: string;
  step?: number;
}

export function PriceRangeSlider({
  minValue,
  maxValue,
  currentMin,
  currentMax,
  onMinChange,
  onMaxChange,
  histogramData,
  title = 'Khoảng giá',
  step = 10000,
}: PriceRangeSliderProps) {
  // Internal state to track slider values during drag
  const [internalLow, setInternalLow] = useState(currentMin);
  const [internalHigh, setInternalHigh] = useState(currentMax);

  // Sync internal state when props change (e.g., when modal opens)
  useEffect(() => {
    setInternalLow(currentMin);
    setInternalHigh(currentMax);
  }, [currentMin, currentMax]);

  // Update internal state during drag - doesn't trigger parent updates
  const handleMinChange = useCallback(
    (value: number) => {
      setInternalLow(Math.min(value, internalHigh - step));
    },
    [internalHigh, step]
  );

  const handleMaxChange = useCallback(
    (value: number) => {
      setInternalHigh(Math.max(value, internalLow + step));
    },
    [internalLow, step]
  );

  // Only update parent when dragging is complete
  const handleMinDragEnd = useCallback(() => {
    onMinChange(internalLow);
  }, [internalLow, onMinChange]);

  const handleMaxDragEnd = useCallback(() => {
    onMaxChange(internalHigh);
  }, [internalHigh, onMaxChange]);

  return (
    <div className='space-y-3'>
      {title && <h3 className='text-sm font-semibold text-[#4D5461]'>{title}</h3>}
      <div className='space-y-4'>
        {/* Price Histogram */}
        <div className='flex items-end justify-between gap-1 h-16 px-1'>
          {histogramData.map((height, index) => {
            const barValue = (index / histogramData.length) * (maxValue - minValue) + minValue;
            const isActive = barValue >= internalLow && barValue <= internalHigh;
            return (
              <div
                key={index}
                className={`flex-1 rounded-t-sm transition-colors duration-300 ${isActive ? 'bg-primary opacity-80' : 'bg-[#E5E7EB]'
                  }`}
                style={{ height: `${height}px` }}
              />
            );
          })}
        </div>

        {/* Dual Range Slider */}
        <div className='relative px-2 h-6'>
          <div className='absolute left-2 right-2 top-2.5 h-1.5 bg-[#E0DEF7] rounded-full'>
            <div
              className='absolute h-full bg-primary rounded-full shadow-[0_0_10px_rgba(112,101,240,0.3)]'
              style={{
                left: `${((internalLow - minValue) / (maxValue - minValue)) * 100}%`,
                right: `${100 - ((internalHigh - minValue) / (maxValue - minValue)) * 100}%`,
              }}
            />
          </div>
          <input
            type='range'
            min={minValue}
            max={maxValue}
            step={step}
            value={internalLow}
            onChange={(e) => handleMinChange(Number(e.target.value))}
            onMouseUp={handleMinDragEnd}
            onTouchEnd={handleMinDragEnd}
            className='absolute top-0 left-0 w-full h-6 appearance-none bg-transparent pointer-events-none z-10 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb:active]:cursor-grabbing'
            style={{ zIndex: internalLow > maxValue / 2 ? 11 : 10 }}
          />
          <input
            type='range'
            min={minValue}
            max={maxValue}
            step={step}
            value={internalHigh}
            onChange={(e) => handleMaxChange(Number(e.target.value))}
            onMouseUp={handleMaxDragEnd}
            onTouchEnd={handleMaxDragEnd}
            className='absolute top-0 left-0 w-full h-6 appearance-none bg-transparent pointer-events-none z-10 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb:active]:cursor-grabbing'
            style={{ zIndex: internalHigh < maxValue / 2 ? 11 : 10 }}
          />
        </div>

        {/* Price Labels */}
        <div className='flex justify-between px-2'>
          <span className='text-lg font-bold text-main-black'>{formatVND(internalLow)}</span>
          <span className='text-lg font-bold text-main-black'>{formatVND(internalHigh)}</span>
        </div>
      </div>
    </div>
  );
}
