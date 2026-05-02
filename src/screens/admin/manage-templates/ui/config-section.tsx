'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { NotificationTemplate } from '@/shared/api/template.api';

interface ConfigSectionProps {
  formData: Partial<NotificationTemplate>;
  setFormData: (data: Partial<NotificationTemplate>) => void;
  isEdit: boolean;
}

export function ConfigSection({ formData, setFormData, isEdit }: ConfigSectionProps) {
  const t = useTranslations('ManageTemplates');

  return (
    <section className='space-y-6'>
      <div className='flex items-center gap-2 border-b border-slate-100 pb-3'>
        <h3 className='font-semibold text-slate-800 text-sm'>{t('form.sections.config')}</h3>
      </div>

      <div className='grid grid-cols-2 gap-6'>
        <div className='space-y-2'>
          <Label htmlFor='templateKey' className='text-sm font-medium text-slate-700'>
            {t('form.templateKey')}
          </Label>
          <Input
            id='templateKey'
            value={formData.template_key}
            onChange={(e) => setFormData({
              ...formData,
              template_key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_').replace(/_+/g, '_')
            })}
            placeholder={t('form.templateKeyPlaceholder')}
            className='h-10 text-sm font-mono focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 disabled:bg-slate-50'
            disabled={isEdit}
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='name' className='text-sm font-medium text-slate-700'>
            {t('form.name')}
          </Label>
          <Input
            id='name'
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={t('form.namePlaceholder')}
            className='h-10 text-sm focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0'
          />
        </div>

        <div className='space-y-2'>
          <Label className='text-sm font-medium text-slate-700'>{t('form.type')}</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value as any })}
          >
            <SelectTrigger className='h-10 text-sm focus:ring-1 focus:ring-primary focus:ring-offset-0'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='EMAIL'>
                  <span className='font-medium text-sm'>{t('form.typeOptions.email')}</span>
              </SelectItem>
              <SelectItem value='IN_APP'>
                  <span className='font-medium text-sm'>{t('form.typeOptions.notification')}</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-2'>
          <Label className='text-sm font-medium text-slate-700'>{t('form.language')}</Label>
          <Select
            value={formData.language}
            onValueChange={(value) => setFormData({ ...formData, language: value as any })}
          >
            <SelectTrigger className='h-10 text-sm focus:ring-1 focus:ring-primary focus:ring-offset-0'>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='en'><span className='font-medium text-sm'>English</span></SelectItem>
              <SelectItem value='vi'><span className='font-medium text-sm'>Tiếng Việt</span></SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}
