'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AdvancedSearchRequest } from '@/shared/types/search';
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
import { Button } from '@/shared/ui/button/button';
import { PROPERTY_TYPES } from '@/shared/config/property-types';
import { VndAmountInput } from '@/shared/ui/vnd-amount-input/vnd-amount-input';
import { RotateCcw } from 'lucide-react';
import { useDistricts } from '@/entities/location/api/use-locations';
import { usePropertyAttributes } from '@/entities/property/api/use-property-attributes';
import type { PropertyAttributeDefinition } from '@/entities/property/api/property-api.types';
import { SaveSearchButton } from '@/features/save-search';

interface SearchSidebarFiltersProps {
  filters: AdvancedSearchRequest;
  onFiltersChange: (filters: AdvancedSearchRequest) => void;
  onReset: () => void;
  searchType?: 'BUY' | 'RENT';
  className?: string;
}

export function SearchSidebarFilters({
  filters,
  onFiltersChange,
  onReset,
  searchType,
  className,
}: SearchSidebarFiltersProps) {
  const [localFilters, setLocalFilters] = useState<AdvancedSearchRequest>(filters);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const { data: districts = [] } = useDistricts();
  const { data: apiAttributes = [] } = usePropertyAttributes(localFilters.propertyType);

  // Build lookup map: attribute code → definition (with ranges)
  const attributeDefMap = useMemo(() => {
    const map = new Map<string, PropertyAttributeDefinition>();
    apiAttributes.forEach((attr) => map.set(attr.attribute_code.toUpperCase(), attr));
    return map;
  }, [apiAttributes]);

  // Sync from parent when filters change externally
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Debounced apply
  const applyFilters = useCallback(
    (updated: AdvancedSearchRequest) => {
      setLocalFilters(updated);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onFiltersChange(updated);
      }, 500);
    },
    [onFiltersChange]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Active attribute codes based on selected property type (from hardcoded config)
  const activeAttributeCodes = useMemo(() => {
    if (!localFilters.propertyType) return [];
    for (const category of PROPERTY_TYPES) {
      const type = category.types.find((t) => t.code === localFilters.propertyType);
      if (type) return type.attributes as string[];
    }
    return [];
  }, [localFilters.propertyType]);

  const sanitizePositiveInt = (raw: string): string | undefined => {
    const digits = raw.replace(/[^0-9]/g, '');
    return digits === '' ? undefined : String(parseInt(digits, 10));
  };

  const setDynamicAttr = (attrCode: string, value: string | undefined) => {
    const prev = localFilters.dynamicAttributes || {};
    if (value === undefined || value === '') {
      const next = { ...prev };
      delete next[attrCode];
      const updated = {
        ...localFilters,
        dynamicAttributes: Object.keys(next).length > 0 ? next : undefined,
      };
      applyFilters(updated);
    } else {
      const updated = {
        ...localFilters,
        dynamicAttributes: { ...prev, [attrCode]: value },
      };
      applyFilters(updated);
    }
  };

  /** Encode a range selection as "min:max" for BE range query */
  const encodeRangeValue = (min: number | null | undefined, max: number | null | undefined): string => {
    const minStr = min != null ? String(min) : '';
    const maxStr = max != null ? String(max) : '';
    return `${minStr}:${maxStr}`;
  };

  const renderDynamicField = (attrCode: string) => {
    const upperCode = attrCode.toUpperCase();
    const attrDef = attributeDefMap.get(upperCode);
    const currentValue = localFilters.dynamicAttributes?.[upperCode];

    const label = attrDef?.attribute_name ?? attrCode;
    const dataType = attrDef?.data_type ?? 'TEXT';
    const ranges = attrDef?.ranges ?? [];

    // NUMBER attributes with ranges → dropdown
    if (dataType === 'NUMBER' && ranges.length > 0) {
      return (
        <div key={upperCode} className='space-y-1'>
          <Label className='text-xs font-medium text-muted-foreground'>{label}</Label>
          <Select
            value={currentValue || 'ALL'}
            onValueChange={(val) => setDynamicAttr(upperCode, val === 'ALL' ? undefined : val)}
          >
            <SelectTrigger className='h-9 text-sm'>
              <SelectValue placeholder='Tất cả' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL'>Tất cả</SelectItem>
              {ranges
                .slice()
                .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
                .map((range) => {
                  const value = encodeRangeValue(range.min_value, range.max_value);
                  return (
                    <SelectItem key={range.range_id} value={value}>
                      {range.label}
                    </SelectItem>
                  );
                })}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (dataType === 'BOOLEAN') {
      return (
        <div
          key={upperCode}
          className='flex items-center justify-between rounded-lg border border-border p-2.5'
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
        <div key={upperCode} className='space-y-1'>
          <Label className='text-xs font-medium text-muted-foreground'>{label}</Label>
          <Input
            type='number'
            min='0'
            step='1'
            placeholder='Tất cả'
            value={currentValue || ''}
            onChange={(e) => setDynamicAttr(upperCode, sanitizePositiveInt(e.target.value))}
            onKeyDown={(e) => ['e', 'E', '+', '-', '.', ','].includes(e.key) && e.preventDefault()}
            className='h-9 text-sm'
            maxLength={10}
          />
        </div>
      );
    }

    // TEXT with ranges → dropdown
    if (dataType === 'TEXT' && ranges.length > 0) {
      return (
        <div key={upperCode} className='space-y-1'>
          <Label className='text-xs font-medium text-muted-foreground'>{label}</Label>
          <Select
            value={currentValue || 'ALL'}
            onValueChange={(val) => setDynamicAttr(upperCode, val === 'ALL' ? undefined : val)}
          >
            <SelectTrigger className='h-9 text-sm'>
              <SelectValue placeholder='Tất cả' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL'>Tất cả</SelectItem>
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
      <div key={upperCode} className='space-y-1'>
        <Label className='text-xs font-medium text-muted-foreground'>{label}</Label>
        <Input
          type='text'
          placeholder='--'
          value={currentValue || ''}
          onChange={(e) => setDynamicAttr(upperCode, e.target.value || undefined)}
          className='h-9 text-sm'
          maxLength={100}
        />
      </div>
    );
  };

  return (
    <div className={className}>
      <div className='space-y-5'>
        {/* District / Location ID */}
        <div className='space-y-2'>
          <Label className='text-sm font-semibold text-foreground'>Quận / Huyện</Label>
          <Select
            value={localFilters.locationId || 'ALL'}
            onValueChange={(value) =>
              applyFilters({ ...localFilters, locationId: value === 'ALL' ? undefined : value })
            }
          >
            <SelectTrigger className='h-9 text-sm'>
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
        <div className='space-y-2'>
          <Label className='text-sm font-semibold text-foreground'>Địa điểm</Label>
          <Input
            type='text'
            placeholder='Tìm kiếm với địa chỉ cụ thể'
            value={localFilters.location || ''}
            onChange={(e) =>
              applyFilters({ ...localFilters, location: e.target.value || undefined })
            }
            className='h-9 text-sm'
            maxLength={100}
          />
        </div>

        {/* Property Type */}
        <div className='space-y-2'>
          <Label className='text-sm font-semibold text-foreground'>Loại bất động sản</Label>
          <Select
            value={localFilters.propertyType || 'ALL'}
            onValueChange={(value) =>
              applyFilters({
                ...localFilters,
                propertyType: value === 'ALL' ? undefined : value,
                dynamicAttributes: value === 'ALL' ? undefined : localFilters.dynamicAttributes,
              })
            }
          >
            <SelectTrigger className='h-9 text-sm'>
              <SelectValue placeholder='Tất cả' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL'>Tất cả</SelectItem>
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
        <div className='space-y-2'>
          <Label className='text-sm font-semibold text-foreground'>Khoảng giá</Label>
          <VndAmountInput
            placeholder='Giá tối thiểu'
            value={localFilters.price?.[0] || 0}
            onChange={(val) =>
              applyFilters({
                ...localFilters,
                price: [val || null, localFilters.price?.[1] || null],
              })
            }
            hidePreview
            className='h-9 text-sm'
          />
          <VndAmountInput
            placeholder='Giá tối đa'
            value={localFilters.price?.[1] || 0}
            onChange={(val) =>
              applyFilters({
                ...localFilters,
                price: [localFilters.price?.[0] || null, val || null],
              })
            }
            hidePreview
            className='h-9 text-sm'
          />
        </div>

        {/* Area Range */}
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <Label className='text-sm font-semibold text-foreground'>Diện tích (m²)</Label>
            <span className='text-xs text-muted-foreground'>
              {localFilters.area?.[0] || 0} - {localFilters.area?.[1] || 500}m²
            </span>
          </div>
          <Slider
            min={0}
            max={500}
            step={10}
            value={[localFilters.area?.[0] || 0, localFilters.area?.[1] || 500]}
            onValueChange={([min, max]: number[]) =>
              applyFilters({ ...localFilters, area: [min, max] })
            }
            className='py-3'
          />
          <div className='grid grid-cols-2 gap-2'>
            <Input
              type='number'
              placeholder='Min'
              value={localFilters.area?.[0] || ''}
              onChange={(e) =>
                applyFilters({
                  ...localFilters,
                  area: [
                    e.target.value ? Number(e.target.value) : 0,
                    localFilters.area?.[1] || 500,
                  ],
                })
              }
              className='h-9 text-sm'
              maxLength={10}
            />
            <Input
              type='number'
              placeholder='Max'
              value={localFilters.area?.[1] || ''}
              onChange={(e) =>
                applyFilters({
                  ...localFilters,
                  area: [
                    localFilters.area?.[0] || 0,
                    e.target.value ? Number(e.target.value) : 500,
                  ],
                })
              }
              className='h-9 text-sm'
              maxLength={10}
            />
          </div>
        </div>

        {/* Dynamic Attributes */}
        {activeAttributeCodes.length > 0 && (
          <div className='space-y-3'>
            <Label className='text-sm font-semibold text-foreground'>Đặc điểm</Label>
            <div className='grid grid-cols-2 gap-2'>
              {activeAttributeCodes
                .filter((code) => {
                  const def = attributeDefMap.get(code.toUpperCase());
                  return def?.data_type !== 'BOOLEAN';
                })
                .map((attr) => renderDynamicField(attr))}
            </div>
            {activeAttributeCodes
              .filter((code) => {
                const def = attributeDefMap.get(code.toUpperCase());
                return def?.data_type === 'BOOLEAN';
              })
              .map((attr) => renderDynamicField(attr))}
          </div>
        )}

        {/* Media Filters */}
        <div className='space-y-2'>
          <Label className='text-sm font-semibold text-foreground'>Phương tiện</Label>
          <div className='space-y-2'>
            <div className='flex items-center justify-between rounded-lg border border-border p-2.5'>
              <span className='text-sm text-foreground'>Có Video</span>
              <Switch
                checked={localFilters.hasVideo || false}
                onCheckedChange={(checked) =>
                  applyFilters({ ...localFilters, hasVideo: checked || undefined })
                }
              />
            </div>
            <div className='flex items-center justify-between rounded-lg border border-border p-2.5'>
              <span className='text-sm text-foreground'>Có 3D Tour</span>
              <Switch
                checked={localFilters.has3D || false}
                onCheckedChange={(checked) =>
                  applyFilters({ ...localFilters, has3D: checked || undefined })
                }
              />
            </div>
          </div>
        </div>

        {/* Sort By */}
        <div className='space-y-2'>
          <Label className='text-sm font-semibold text-foreground'>Sắp xếp</Label>
          <Select
            value={localFilters.sortBy || 'PRIORITY'}
            onValueChange={(value) =>
              applyFilters({
                ...localFilters,
                sortBy: value as AdvancedSearchRequest['sortBy'],
              })
            }
          >
            <SelectTrigger className='h-9 text-sm'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='PRIORITY'>Ưu tiên</SelectItem>
              <SelectItem value='DATE_DESC'>Mới nhất</SelectItem>
              <SelectItem value='PRICE_ASC'>Giá thấp → cao</SelectItem>
              <SelectItem value='PRICE_DESC'>Giá cao → thấp</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reset + Save row */}
        <div className='grid grid-cols-2 gap-2'>
          <Button
            type='button'
            variant='ghost'
            onClick={onReset}
            className='w-full text-sm text-muted-foreground hover:text-foreground'
          >
            <RotateCcw className='mr-1 h-3.5 w-3.5' />
            Đặt lại
          </Button>
          {searchType ? (
            <SaveSearchButton
              searchType={searchType}
              criteria={localFilters as Record<string, unknown>}
              fullWidth
            />
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}
