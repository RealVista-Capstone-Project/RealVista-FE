'use client';

import { Button } from '@/shared/ui/button';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

export const EngagementHeaderSection = () => {
  const t = useTranslations('Engagement');

  return (
    <div className='bg-background border-b border-border px-6 py-3 flex items-center justify-between'>
      <h2 className='text-lg font-semibold text-foreground'>{t('page.title')}</h2>
    </div>
  );
};
