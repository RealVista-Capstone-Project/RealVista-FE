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
import { PROPERTY_TYPES } from '@/shared/config/property-types';
import { VndAmountInput } from '@/shared/ui/vnd-amount-input/vnd-amount-input';
import { useDistricts } from '@/entities/location/api/use-locations';
import { usePropertyAttributes } from '@/entities/property/api/use-property-attributes';
import type { PropertyAttributeDefinition } from '@/entities/property/api/property-api.types';

interface AdvancedSearchFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFilters: (filters: AdvancedSearchRequest) => void;
  initialFilters?: AdvancedSearchRequest;
  onReset?: () => void;
  className?: string;
}

export function AdvancedSearchFilters({
  open,
  onOpenChange,
  onApplyFilters,
  initialFilters,
  onReset,
  className,
}: AdvancedSearchFiltersProps) {
  const [filters, setFilters] = useState<AdvancedSearchRequest>(
    initialFilters || {
      listingType: 'SALE',
      sortBy: 'PRIORITY',
    }
  );
  const [resetKey, setResetKey] = useState(0);

  const { data: districts = [] } = useDistricts();
  const { data: apiAttributes = [] } = usePropertyAttributes(filters.propertyType);

  // Build lookup map: attribute code → definition (with ranges)
  const attributeDefMap = useMemo(() => {
    const map = new Map<string, PropertyAttributeDefinition>();
    apiAttributes.forEach((attr) => map.set(attr.attribute_code.toUpperCase(), attr));
    return map;
  }, [apiAttributes]);

  // Sync state with props ONLY when opening to prevent infinite update loops
  useEffect(() => {
    if (open && initialFilters) {
      setFilters(initialFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]); // Only sync on open

  const handleApply = () => {
    onApplyFilters(filters);
    onOpenChange(false);
  };

  const handleReset = () => {
    setFilters({
      listingType: filters.listingType || 'SALE',
      sortBy: 'PRIORITY',
      propertyType: undefined,
      propertyCategory: undefined,
      location: undefined,
      locationId: undefined,
      price: undefined,
      area: undefined,
      dynamicAttributes: undefined,
      hasVideo: false,
      has3D: false,
    });
    setResetKey((prev) => prev + 1);
    if (onReset) onReset();
  };

  // Active attribute codes based on selected property type
  const activeAttributeCodes = useMemo(() => {
    if (!filters.propertyType) return [];
    for (const category of PROPERTY_TYPES) {
      const type = category.types.find((t) => t.code === filters.propertyType);
      if (type) return type.attributes as string[];
    }
    return [];
  }, [filters]);

  const sanitizePositiveInt = (raw: string): string | undefined => {
    const digits = raw.replace(/[^0-9]/g, '');
    return digits === '' ? undefined : String(parseInt(digits, 10));
  };

  const setDynamicAttr = (attrCode: string, value: string | undefined) => {
    const prev = filters.dynamicAttributes || {};
    if (value === undefined || value === '') {
      const next = { ...prev };
      delete next[attrCode];
      setFilters({ ...filters, dynamicAttributes: Object.keys(next).length > 0 ? next : undefined });
    } else {
      setFilters({ ...filters, dynamicAttributes: { ...prev, [attrCode]: value } });
    }
  };

  const encodeRangeValue = (min: number | null | undefined, max: number | null | undefined): string => {
    const minStr = min != null ? String(min) : '';
    const maxStr = max != null ? String(max) : '';
    return `${minStr}:${maxStr}`;
  };

  const renderDynamicField = (attrCode: string) => {
    const upperCode = attrCode.toUpperCase();
    const attrDef = attributeDefMap.get(upperCode);
    const currentValue = filters.dynamicAttributes?.[upperCode];

    const label = attrDef?.attribute_name ?? attrCode;
    const dataType = attrDef?.data_type ?? 'TEXT';
    const ranges = attrDef?.ranges ?? [];

    // NUMBER with ranges → dropdown
    if (dataType === 'NUMBER' && ranges.length > 0) {
      return (
        <div key={upperCode} className='space-y-1.5'>
          <Label className='text-sm font-medium text-foreground'>{label}</Label>
          <Select
            key={`${upperCode}-${resetKey}`}
            value={currentValue || 'ANY'}
            onValueChange={(val) => setDynamicAttr(upperCode, val === 'ANY' ? undefined : val)}
          >
            <SelectTrigger>
              <SelectValue placeholder='Bất kỳ' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ANY'>Bất kỳ</SelectItem>
              {ranges
                .slice()
                .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
                .map((range) => (
                  <SelectItem
                    key={range.range_id}
                    value={encodeRangeValue(range.min_value, range.max_value)}
                  >
                    {range.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (dataType === 'BOOLEAN') {
      return (
        <div
          key={upperCode}
          className='flex items-center justify-between p-3 border border-border rounded-lg'
        >
          <span className='text-sm text-foreground'>{label}</span>
          <Switch
            checked={currentValue === 'true'}
            onCheckedChange={(checked) => setDynamicAttr(upperCode, checked ? 'true' : undefined)}
          />
        </div>
      );
    }

    if (dataType === 'NUMBER') {
      return (
        <div key={upperCode} className='space-y-1.5'>
          <Label className='text-sm font-medium text-foreground'>{label}</Label>
          <Input
            type='number'
            min='0'
            step='1'
            placeholder='Bất kỳ'
            value={currentValue || ''}
            onChange={(e) => setDynamicAttr(upperCode, sanitizePositiveInt(e.target.value))}
            onKeyDown={(e) => ['e', 'E', '+', '-', '.', ','].includes(e.key) && e.preventDefault()}
            maxLength={10}
          />
        </div>
      );
    }

    // TEXT with ranges → dropdown
    if (dataType === 'TEXT' && ranges.length > 0) {
      return (
        <div key={upperCode} className='space-y-1.5'>
          <Label className='text-sm font-medium text-foreground'>{label}</Label>
          <Select
            key={`${upperCode}-${resetKey}`}
            value={currentValue || 'ANY'}
            onValueChange={(val) => setDynamicAttr(upperCode, val === 'ANY' ? undefined : val)}
          >
            <SelectTrigger>
              <SelectValue placeholder='Bất kỳ' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ANY'>Bất kỳ</SelectItem>
              {ranges
                .slice()
                .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
                .map((range) => (
                  <SelectItem key={range.range_id} value={range.label}>
                    {range.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    // TEXT
    return (
      <div key={upperCode} className='space-y-1.5'>
        <Label className='text-sm font-medium text-foreground'>{label}</Label>
        <Input
          type='text'
          placeholder='Nhập giá trị'
          value={currentValue || ''}
          onChange={(e) => setDynamicAttr(upperCode, e.target.value || undefined)}
          maxLength={100}
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
          {/* District / Location ID */}
          <div className='space-y-3'>
            <Label>Quận / Huyện</Label>
            <Select
              key={`district-${resetKey}`}
              value={filters.locationId || 'ALL'}
              onValueChange={(value) =>
                setFilters({ ...filters, locationId: value === 'ALL' ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder='Tất cả' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL'>Tất cả</SelectItem>
                {districts.map((d) => (
                  <SelectItem key={d.location_id} value={d.location_id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location text search */}
          <div className='space-y-3'>
            <Label>Địa điểm</Label>
            <Input
              type='text'
              placeholder='Hà Nội, Việt Nam'
              value={filters.location || ''}
              onChange={(e) =>
                setFilters({ ...filters, location: e.target.value || undefined })
              }
              maxLength={100}
            />
          </div>

          {/* Property Type Selector */}
          <div className='space-y-3'>
            <Label>Loại bất động sản</Label>
            <Select
              key={`property-type-${resetKey}`}
              value={filters.propertyType || undefined}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  propertyType: value || undefined,
                  dynamicAttributes: value ? filters.dynamicAttributes : undefined,
                })
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
              <VndAmountInput
                placeholder='Giá tối thiểu'
                value={filters.price?.[0] || 0}
                onChange={(val) =>
                  setFilters({
                    ...filters,
                    price: [val || null, filters.price?.[1] || null],
                  })
                }
                hidePreview
              />
              <VndAmountInput
                placeholder='Giá tối đa'
                value={filters.price?.[1] || 0}
                onChange={(val) =>
                  setFilters({
                    ...filters,
                    price: [filters.price?.[0] || null, val || null],
                  })
                }
                hidePreview
              />
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
                maxLength={10}
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
                maxLength={10}
              />
            </div>
          </div>

          {/* Dynamic Attributes — shown only when a property type is selected */}
          {activeAttributeCodes.length > 0 && (
            <div className='space-y-4 pt-2'>
              <h4 className='text-sm font-semibold text-foreground'>
                Đặc điểm bổ sung
              </h4>

              {/* Non-boolean fields */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {activeAttributeCodes
                  .filter((code) => {
                    const def = attributeDefMap.get(code.toUpperCase());
                    return def?.data_type !== 'BOOLEAN';
                  })
                  .map((attr) => renderDynamicField(attr))}
              </div>

              {/* Boolean switches */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {activeAttributeCodes
                  .filter((code) => {
                    const def = attributeDefMap.get(code.toUpperCase());
                    return def?.data_type === 'BOOLEAN';
                  })
                  .map((attr) => renderDynamicField(attr))}
              </div>
            </div>
          )}

          {/* Media Filters */}
          <div className='space-y-3'>
            <Label>Phương tiện</Label>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='flex items-center justify-between p-3 border border-border rounded-lg'>
                <span className='text-sm text-foreground'>Có Video</span>
                <Switch
                  checked={filters.hasVideo || false}
                  onCheckedChange={(checked) =>
                    setFilters({ ...filters, hasVideo: checked || undefined })
                  }
                />
              </div>
              <div className='flex items-center justify-between p-3 border border-border rounded-lg'>
                <span className='text-sm text-foreground'>Có 3D Tour</span>
                <Switch
                  checked={filters.has3D || false}
                  onCheckedChange={(checked) =>
                    setFilters({ ...filters, has3D: checked || undefined })
                  }
                />
              </div>
            </div>
          </div>

          {/* Sort By */}
          <div className='space-y-3'>
            <Label>Sắp xếp theo</Label>
            <Select
              key={`sort-by-${resetKey}`}
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

        <SheetFooter className='p-6 border-t bg-secondary sm:flex-row sm:justify-between sm:space-x-0'>
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
