import * as React from 'react';
import { Save, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SheetHeader, SheetTitle, SheetDescription } from '@/shared/ui/sheet';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';

interface EditorHeaderProps {
    isEdit: boolean;
    templateKey?: string;
    onCancel: () => void;
    onSubmit: () => void;
    isPending: boolean;
}

export function EditorHeader({ isEdit, templateKey, onCancel, onSubmit, isPending }: EditorHeaderProps) {
  const t = useTranslations('ManageTemplates');

  return (
    <div className='bg-white px-8 py-5 flex items-center justify-between border-b border-slate-200 z-10 shrink-0'>
      <SheetHeader className='p-0 flex flex-row items-center gap-4 space-y-0'>
        <div className='flex items-center gap-3'>
          <SheetTitle className='text-xl font-semibold text-slate-800 m-0'>
            {isEdit ? t('form.editTitle') : t('form.createTitle')}
          </SheetTitle>
          <Badge variant='secondary' className='font-mono text-xs bg-slate-100 text-slate-600 border border-slate-200'>
            {isEdit ? templateKey : t('form.systemBadge')}
          </Badge>
        </div>
      </SheetHeader>

      <div className='flex items-center gap-3'>
        <Button variant='outline' onClick={onCancel} className='h-9 px-4 text-sm font-medium'>
          {t('form.cancel')}
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isPending}
          className='gap-2 h-9 px-5 shadow-sm text-sm font-medium'
        >
          {isPending ? t('form.saving') : t('form.save')}
        </Button>
      </div>
    </div>
  );
}
