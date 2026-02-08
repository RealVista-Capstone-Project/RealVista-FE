'use client';

import { useCallback, useEffect, useState } from 'react';

// VND Currency Formatter
function formatVND(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
}

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
        <div className='flex items-end justify-between gap-0.5 h-14'>
          {histogramData.map((height, index) => (
            <div
              key={index}
              className='flex-1 bg-[#E5E7EB] rounded-t-sm'
              style={{ height: `${height}px` }}
            />
          ))}
        </div>

        {/* Dual Range Slider */}
        <div className='relative px-2'>
          <div className='relative h-1 bg-[#E0DEF7] rounded-full'>
            <div
              className='absolute h-1 bg-[#7065F0] rounded-full'
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
            className='absolute top-0 w-full h-1 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#7065F0] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb:active]:cursor-grabbing [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#7065F0] [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb:active]:cursor-grabbing'
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
            className='absolute top-0 w-full h-1 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#7065F0] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb:active]:cursor-grabbing [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#7065F0] [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb:active]:cursor-grabbing'
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
