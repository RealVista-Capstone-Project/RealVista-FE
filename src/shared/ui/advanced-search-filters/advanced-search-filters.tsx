'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/shared/ui/button/button';
import { AdvancedSearchRequest } from '@/shared/types/search';
import { cn } from '@/shared/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet/sheet';
import { Input } from '@/shared/ui/input/input';
import { Checkbox } from '@/shared/ui/checkbox/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel as SelectGroupLabel,
} from '@/shared/ui/select/select';
import { Label } from '@/shared/ui/label/label';
import { Slider } from '@/shared/ui/slider/slider';
import { Switch } from '@/shared/ui/switch/switch';
import {
  PROPERTY_TYPES,
  ATTRIBUTE_LABELS,
  ATTRIBUTE_TYPES,
  PropertyAttribute,
} from '@/shared/config/property-types';

interface AdvancedSearchFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFilters: (filters: AdvancedSearchRequest) => void;
  initialFilters?: AdvancedSearchRequest;
  className?: string;
}

export function AdvancedSearchFilters({
  open,
  onOpenChange,
  onApplyFilters,
  initialFilters,
  className,
}: AdvancedSearchFiltersProps) {
  const [filters, setFilters] = useState<AdvancedSearchRequest>(
    initialFilters || {
      listingType: 'SALE',
      sortBy: 'PRIORITY',
    }
  );

  // Sync state with props when opening
  useEffect(() => {
    if (open && initialFilters) {
      setFilters(initialFilters);
    }
  }, [open, initialFilters]);

  const handleApply = () => {
    onApplyFilters(filters);
    onOpenChange(false);
  };

  const handleReset = () => {
    setFilters({
      listingType: filters.listingType || 'SALE',
      sortBy: 'PRIORITY',
    });
  };

  // Derive the selected property type from state
  const selectedPropertyType = useMemo(() => {
    return (filters as any).propertyType as string | undefined;
  }, [filters]);

  // Find attributes for the selected type
  const activeAttributes = useMemo(() => {
    if (!selectedPropertyType) return [];

    for (const category of PROPERTY_TYPES) {
      const type = category.types.find((t) => t.code === selectedPropertyType);
      if (type) return type.attributes;
    }
    return [];
  }, [selectedPropertyType]);

  // Helper to render dynamic input
  const renderDynamicField = (attrCode: PropertyAttribute) => {
    const label = ATTRIBUTE_LABELS[attrCode];
    const type = ATTRIBUTE_TYPES[attrCode];

    if (type === 'boolean') {
      return (
        <div
          key={attrCode}
          className='flex items-center justify-between p-3 border border-grey-200 rounded-lg'
        >
          <span className='text-sm text-main-black'>{label}</span>
          <Switch
            checked={!!(filters as any)[attrCode]}
            onCheckedChange={(checked) =>
              setFilters({ ...filters, [attrCode]: checked })
            }
          />
        </div>
      );
    }

    if (type === 'number') {
      return (
        <div key={attrCode} className='space-y-1.5'>
          <Label className='text-sm font-medium text-main-black'>{label}</Label>
          <Input
            type='number'
            min='0'
            placeholder='Any'
            value={(filters as any)[attrCode] || ''}
            onChange={(e) =>
              setFilters({
                ...filters,
                [attrCode]: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
      );
    }

    // Text / Select
    return (
      <div key={attrCode} className='space-y-1.5'>
        <Label className='text-sm font-medium text-main-black'>{label}</Label>
        <Input
          type='text'
          placeholder='Any'
          value={(filters as any)[attrCode] || ''}
          onChange={(e) =>
            setFilters({
              ...filters,
              [attrCode]: e.target.value || undefined,
            })
          }
        />
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side='right'
        className={cn('w-full sm:w-[540px] flex flex-col p-0', className)}
      >
        <SheetHeader className='px-6 py-6 border-b'>
          <SheetTitle>Bộ lọc nâng cao</SheetTitle>
          <SheetDescription>
            Tùy chỉnh tìm kiếm để tìm bất động sản ưng ý của bạn.
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-y-auto p-6 space-y-6'>

            {/* Property Type Selector */}
          <div className='space-y-3'>
            <Label>Loại bất động sản</Label>
            <Select
              value={(filters as any).propertyType || undefined}
              onValueChange={(value) =>
                setFilters({ ...filters, propertyType: value || undefined } as any)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder='Tất cả' />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((cat) => (
                  <SelectGroup key={cat.code}>
                    <SelectGroupLabel>{cat.label}</SelectGroupLabel>
                    {cat.types.map((type) => (
                      <SelectItem key={type.code} value={type.code}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Range */}
          <div className='space-y-3'>
            <Label>Khoảng giá</Label>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1.5'>
                <Input
                  type='number'
                  placeholder='Giá tối thiểu'
                  value={filters.price?.[0] || ''}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      price: [
                        e.target.value ? Number(e.target.value) : null,
                        filters.price?.[1] || null,
                      ],
                    })
                  }
                />
              </div>
              <div className='space-y-1.5'>
                <Input
                  type='number'
                  placeholder='Giá tối đa'
                  value={filters.price?.[1] || ''}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      price: [
                        filters.price?.[0] || null,
                        e.target.value ? Number(e.target.value) : null,
                      ],
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Area Range Slider */}
          <div className='space-y-3'>
            <div className='flex justify-between'>
              <Label>Diện tích (m²)</Label>
              <span className='text-sm text-muted-foreground'>
                {filters.area?.[0] || 0}m² - {filters.area?.[1] || 500}m²
              </span>
            </div>
            <Slider
              min={0}
              max={500}
              step={10}
              value={[filters.area?.[0] || 0, filters.area?.[1] || 500]}
              onValueChange={([min, max]: number[]) =>
                setFilters({
                  ...filters,
                  area: [min, max],
                })
              }
              className='py-4'
            />
            <div className='grid grid-cols-2 gap-3'>
              <Input
                type='number'
                placeholder='Tối thiểu'
                value={filters.area?.[0] || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    area: [
                      e.target.value ? Number(e.target.value) : 0,
                      filters.area?.[1] || 500,
                    ],
                  })
                }
              />
              <Input
                type='number'
                placeholder='Tối đa'
                value={filters.area?.[1] || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    area: [
                      filters.area?.[0] || 0,
                      e.target.value ? Number(e.target.value) : 500,
                    ],
                  })
                }
              />
            </div>
          </div>

          {/* Bedrooms & Bathrooms */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-3'>
              <Label>Phòng ngủ (tối thiểu)</Label>
              <Input
                type='number'
                min={0}
                placeholder='Bất kỳ'
                value={filters.bedrooms || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    bedrooms: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>
            <div className='space-y-3'>
              <Label>Phòng tắm (tối thiểu)</Label>
              <Input
                type='number'
                min={0}
                placeholder='Bất kỳ'
                value={filters.bathrooms || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    bathrooms: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>
          </div>

          {/* Dynamic Attributes Section */}
          {activeAttributes.filter(
            (attr) => attr !== 'BEDROOMS' && attr !== 'BATHROOMS'
          ).length > 0 && (
            <div className='space-y-4 pt-2'>
              <h4 className='text-sm font-semibold text-main-black'>
                Đặc điểm bổ sung
              </h4>

              {/* Number and Text Inputs */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {activeAttributes
                  .filter(
                    (attr) => attr !== 'BEDROOMS' && attr !== 'BATHROOMS'
                  )
                  .filter((attr) => ATTRIBUTE_TYPES[attr] !== 'boolean')
                  .map((attr) => renderDynamicField(attr))}
              </div>

              {/* Boolean Switches */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {activeAttributes
                  .filter(
                    (attr) => attr !== 'BEDROOMS' && attr !== 'BATHROOMS'
                  )
                  .filter((attr) => ATTRIBUTE_TYPES[attr] === 'boolean')
                  .map((attr) => renderDynamicField(attr))}
              </div>
            </div>
          )}

          {/* Media Filters */}
          <div className='space-y-3'>
            <Label>Phương tiện</Label>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='flex items-center justify-between p-3 border border-grey-200 rounded-lg'>
                <span className='text-sm text-main-black'>Có Video</span>
                <Switch
                  checked={filters.hasVideo || false}
                  onCheckedChange={(checked) =>
                    setFilters({ ...filters, hasVideo: checked })
                  }
                />
              </div>
              <div className='flex items-center justify-between p-3 border border-grey-200 rounded-lg'>
                <span className='text-sm text-main-black'>Có 3D Tour</span>
                <Switch
                  checked={filters.has3D || false}
                  onCheckedChange={(checked) =>
                    setFilters({ ...filters, has3D: checked })
                  }
                />
              </div>
            </div>
          </div>

          {/* Sort By */}
          <div className='space-y-3'>
            <Label>Sắp xếp theo</Label>
            <Select
              value={filters.sortBy || 'PRIORITY'}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  sortBy: value as AdvancedSearchRequest['sortBy'],
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder='Chọn thứ tự sắp xếp' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='PRIORITY'>Ưu tiên (Nổi bật trước)</SelectItem>
                <SelectItem value='DATE_DESC'>Mới nhất trước</SelectItem>
                <SelectItem value='PRICE_ASC'>Giá: Thấp đến Cao</SelectItem>
                <SelectItem value='PRICE_DESC'>Giá: Cao đến Thấp</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter className='p-6 border-t bg-grey-50 sm:flex-row sm:justify-between sm:space-x-0'>
          <Button type='button' variant='ghost' onClick={handleReset}>
            Đặt lại
          </Button>
          <div className='flex gap-3'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type='button' onClick={handleApply}>
              Áp dụng
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
