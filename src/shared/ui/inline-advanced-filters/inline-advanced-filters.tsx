import { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronUp, Home, Maximize2, Video } from 'lucide-react';
import { Button } from '@/shared/ui/button/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/shared/ui/select';
import { Slider } from '@/shared/ui/slider';
import { Switch } from '@/shared/ui/switch';
import { AdvancedSearchRequest } from '@/shared/types/search';
import { PROPERTY_TYPES } from '@/shared/config/property-types';
import { useDistricts } from '@/entities/location/api/use-locations';
import { usePropertyAttributes } from '@/entities/property/api/use-property-attributes';
import type { PropertyAttributeDefinition } from '@/entities/property/api/property-api.types';

interface InlineAdvancedFiltersProps {
  onApplyFilters: (filters: Partial<AdvancedSearchRequest>) => void;
  initialFilters?: Partial<AdvancedSearchRequest>;
  listingType: 'SALE' | 'RENT';
}

export function InlineAdvancedFilters({
  onApplyFilters,
  initialFilters = {},
  listingType,
}: InlineAdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<Partial<AdvancedSearchRequest>>(initialFilters);

  const { data: districts = [] } = useDistricts();
  const { data: apiAttributes = [] } = usePropertyAttributes(filters.propertyType);

  // Build lookup map: attribute code → definition (with ranges)
  const attributeDefMap = useMemo(() => {
    const map = new Map<string, PropertyAttributeDefinition>();
    apiAttributes.forEach((attr) => map.set(attr.attribute_code.toUpperCase(), attr));
    return map;
  }, [apiAttributes]);

  // Sync filters with initialFilters when it changes (e.g., from URL navigation)
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  // Active attribute codes based on selected property type
  const activeAttributeCodes = useMemo(() => {
    if (!filters.propertyType) return [];
    for (const category of PROPERTY_TYPES) {
      const type = category.types.find((t) => t.code === filters.propertyType);
      if (type) return type.attributes as string[];
    }
    return [];
  }, [filters]);

  const handleApply = () => {
    onApplyFilters(filters);
  };

  const handleReset = () => {
    const resetFilters: Partial<AdvancedSearchRequest> = {
      listingType,
    };
    setFilters(resetFilters);
    onApplyFilters(resetFilters);
  };

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

  const encodeRangeValue = (min: number | null, max: number | null): string => {
    const minStr = min !== null ? String(min) : '';
    const maxStr = max !== null ? String(max) : '';
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
        <div key={upperCode}>
          <label className='block text-sm font-medium text-foreground mb-2'>{label}</label>
          <Select
            value={currentValue || ''}
            onValueChange={(val) => setDynamicAttr(upperCode, val || undefined)}
          >
            <SelectTrigger className='w-full px-4 py-2 border border-primary/20 rounded-lg'>
              <SelectValue placeholder='Bất kỳ' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=''>Bất kỳ</SelectItem>
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
        <div key={upperCode} className='flex items-center justify-between p-3 border border-primary/20 rounded-lg'>
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
        <div key={upperCode}>
          <label className='block text-sm font-medium text-foreground mb-2'>{label}</label>
          <input
            type='number'
            min='0'
            step='1'
            placeholder='Bất kỳ'
            value={currentValue || ''}
            onChange={(e) => setDynamicAttr(upperCode, sanitizePositiveInt(e.target.value))}
            onKeyDown={(e) => ['e', 'E', '+', '-', '.', ','].includes(e.key) && e.preventDefault()}
            className='w-full px-4 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
            maxLength={10}
          />
        </div>
      );
    }

    // TEXT with ranges → dropdown
    if (dataType === 'TEXT' && ranges.length > 0) {
      return (
        <div key={upperCode}>
          <label className='block text-sm font-medium text-foreground mb-2'>{label}</label>
          <Select
            value={currentValue || ''}
            onValueChange={(val) => setDynamicAttr(upperCode, val || undefined)}
          >
            <SelectTrigger className='w-full px-4 py-2 border border-primary/20 rounded-lg'>
              <SelectValue placeholder='Bất kỳ' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=''>Bất kỳ</SelectItem>
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
      <div key={upperCode}>
        <label className='block text-sm font-medium text-foreground mb-2'>{label}</label>
        <input
          type='text'
          placeholder='Nhập giá trị'
          value={currentValue || ''}
          onChange={(e) => setDynamicAttr(upperCode, e.target.value || undefined)}
          className='w-full px-4 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
          maxLength={100}
        />
      </div>
    );
  };

  return (
    <div className='w-full bg-white rounded-lg border border-primary/20'>
      {/* Toggle Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className='w-full flex items-center justify-between px-6 py-4 hover:bg-primary/5 transition-colors'
      >
        <span className='text-base font-medium text-foreground'>Advanced Filters</span>
        {isExpanded ? (
          <ChevronUp className='h-5 w-5 text-secondary' />
        ) : (
          <ChevronDown className='h-5 w-5 text-secondary' />
        )}
      </button>

      {/* Filters Content */}
      {isExpanded && (
        <div className='px-6 pb-6 pt-2 border-t border-primary/20'>

          {/* District */}
          <div className='mb-6'>
            <label className='flex items-center gap-2 text-sm font-medium text-foreground mb-2'>
              Quận / Huyện
            </label>
            <Select
              value={filters.locationId || 'ALL'}
              onValueChange={(value) =>
                setFilters({ ...filters, locationId: value === 'ALL' ? undefined : value })
              }
            >
              <SelectTrigger className='w-full md:w-1/2 lg:w-1/3'>
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

          {/* Property Type Selector */}
          <div className='mb-6'>
            <label className='flex items-center gap-2 text-sm font-medium text-foreground mb-2'>
              <Home className='w-4 h-4 text-primary' />
              Loại bất động sản
            </label>
            <Select
              value={filters.propertyType || undefined}
              onValueChange={(value) => setFilters({ ...filters, propertyType: value || undefined })}
            >
              <SelectTrigger className='w-full md:w-1/2 lg:w-1/3'>
                <SelectValue placeholder='Tất cả loại' />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((cat) => (
                  <SelectGroup key={cat.code}>
                    <SelectLabel>{cat.label}</SelectLabel>
                    {cat.types.map((type) => (
                      <SelectItem key={type.code} value={type.code}>{type.label}</SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Basic Filters Section */}
          <div className='mb-6'>
            <h4 className='text-sm font-semibold text-foreground mb-4'>Thông tin cơ bản</h4>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Area Range Slider */}
              <div className='md:col-span-2'>
                <label className='flex items-center gap-2 text-sm font-medium text-foreground mb-2'>
                  <Maximize2 className='w-4 h-4 text-primary' />
                  Diện tích: {filters.area?.[0] || 0}m² - {filters.area?.[1] || 500}m²
                </label>
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
                  className='mt-2'
                />
              </div>
            </div>
          </div>

          {/* Dynamic Attributes Section */}
          {activeAttributeCodes.length > 0 && (
            <div className='mb-6'>
              <h4 className='text-sm font-semibold text-foreground mb-4'>Đặc điểm bổ sung</h4>

              {activeAttributeCodes
                .filter((code) => {
                  const def = attributeDefMap.get(code.toUpperCase());
                  return def?.data_type !== 'BOOLEAN';
                })
                .length > 0 && (
                  <div className='grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-4'>
                    {activeAttributeCodes
                      .filter((code) => {
                        const def = attributeDefMap.get(code.toUpperCase());
                        return def?.data_type !== 'BOOLEAN';
                      })
                      .map((attr) => renderDynamicField(attr))}
                  </div>
                )}

              {activeAttributeCodes
                .filter((code) => {
                  const def = attributeDefMap.get(code.toUpperCase());
                  return def?.data_type === 'BOOLEAN';
                })
                .length > 0 && (
                  <div className='grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4'>
                    {activeAttributeCodes
                      .filter((code) => {
                        const def = attributeDefMap.get(code.toUpperCase());
                        return def?.data_type === 'BOOLEAN';
                      })
                      .map((attr) => renderDynamicField(attr))}
                  </div>
                )}
            </div>
          )}

          {/* Media Filters */}
          <div className='mb-4'>
            <h4 className='flex items-center gap-2 text-sm font-semibold text-foreground mb-4'>
              <Video className='w-4 h-4 text-primary' />
              Phương tiện
            </h4>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='flex items-center justify-between p-3 border border-primary/20 rounded-lg'>
                <span className='text-sm text-foreground'>Có Video</span>
                <Switch
                  checked={filters.hasVideo || false}
                  onCheckedChange={(checked) =>
                    setFilters({ ...filters, hasVideo: checked || undefined })
                  }
                />
              </div>
              <div className='flex items-center justify-between p-3 border border-primary/20 rounded-lg'>
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
          <div className='mb-4'>
            <label className='block text-sm font-medium text-foreground mb-2'>Sort By</label>
            <select
              value={filters.sortBy || 'PRIORITY'}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  sortBy: e.target.value as AdvancedSearchRequest['sortBy'],
                })
              }
              className='w-full md:w-64 px-4 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
            >
              <option value='PRIORITY'>Priority (Featured First)</option>
              <option value='DATE_DESC'>Newest First</option>
              <option value='PRICE_ASC'>Price: Low to High</option>
              <option value='PRICE_DESC'>Price: High to Low</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className='flex gap-3'>
            <Button type='button' variant='outline' onClick={handleReset} className='px-6'>
              Reset
            </Button>
            <Button
              type='button'
              onClick={handleApply}
              className='px-6 bg-primary hover:bg-primary/90'
            >
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
